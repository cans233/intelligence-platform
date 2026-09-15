from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db
from backend.app.api.errors import ApiHttpException
from backend.app.api.schemas import (
    CitationDto,
    ClaimDto,
    FamilyMemberDto,
    LegalEventDto,
    PatentDetailDto,
    PatentListItemDto,
    SourceRecordDto,
)
from backend.app.models import (
    ApplicationApplicant,
    ApplicationInventor,
    PatentAbstract,
    PatentApplication,
    PatentCitation,
    PatentClaim,
    PatentFamilyMember,
    PatentLegalEvent,
    PatentPublication,
    SourceRecord,
)

router = APIRouter(prefix="/patents", tags=["patents"])


@router.get("")
def list_patents(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    country: str | None = None,
    db: Session = Depends(get_db),
):
    query = select(PatentPublication).join(PatentPublication.application)
    count_query = select(func.count()).select_from(PatentPublication).join(PatentPublication.application)
    filters = []
    if keyword:
        pattern = f"%{keyword}%"
        filters.append(
            or_(
                PatentPublication.title.ilike(pattern),
                PatentPublication.publication_number.ilike(pattern),
                PatentApplication.application_number.ilike(pattern),
            )
        )
    if country:
        filters.append(PatentApplication.country == country.upper())
    query = query.where(*filters).order_by(PatentPublication.publication_date.desc().nullslast())
    total = db.scalar(count_query.where(*filters)) or 0
    items = db.scalars(query.offset((page - 1) * page_size).limit(page_size)).all()
    data = {
        "items": [patent_list_item(item) for item in items],
        "page": page,
        "page_size": page_size,
        "total": total,
    }
    return ok(data, request)


@router.get("/{patent_id}")
def get_patent(patent_id: UUID, request: Request, db: Session = Depends(get_db)):
    publication = db.scalar(
        select(PatentPublication)
        .options(
            selectinload(PatentPublication.application)
            .selectinload(PatentApplication.applicants)
            .selectinload(ApplicationApplicant.applicant),
            selectinload(PatentPublication.application)
            .selectinload(PatentApplication.inventors)
            .selectinload(ApplicationInventor.inventor),
            selectinload(PatentPublication.claims),
            selectinload(PatentPublication.abstracts),
            selectinload(PatentPublication.descriptions),
            selectinload(PatentPublication.classifications),
            selectinload(PatentPublication.family_members),
            selectinload(PatentPublication.citations),
            selectinload(PatentPublication.legal_events),
            selectinload(PatentPublication.source_records),
        )
        .where(PatentPublication.id == patent_id)
    )
    if publication is None:
        raise ApiHttpException(404, "PATENT_NOT_FOUND", "专利不存在")
    return ok(patent_detail(publication), request)


@router.get("/{patent_id}/claims")
def get_claims(patent_id: UUID, request: Request, db: Session = Depends(get_db)):
    ensure_publication(patent_id, db)
    claims = db.scalars(
        select(PatentClaim)
        .where(PatentClaim.publication_id == patent_id)
        .order_by(PatentClaim.claim_no)
    ).all()
    return ok([ClaimDto.model_validate(item).model_dump(mode="json") for item in claims], request)


@router.get("/{patent_id}/family")
def get_family(patent_id: UUID, request: Request, db: Session = Depends(get_db)):
    publication = ensure_publication(patent_id, db)
    members = db.scalars(
        select(PatentFamilyMember)
        .options(selectinload(PatentFamilyMember.publication))
        .where(PatentFamilyMember.family_id == publication.application.family_id)
    ).all()
    return ok([family_member(item) for item in members], request)


@router.get("/{patent_id}/citations")
def get_citations(patent_id: UUID, request: Request, db: Session = Depends(get_db)):
    ensure_publication(patent_id, db)
    citations = db.scalars(
        select(PatentCitation).where(PatentCitation.citing_publication_id == patent_id)
    ).all()
    return ok([CitationDto.model_validate(item).model_dump(mode="json") for item in citations], request)


@router.get("/{patent_id}/sources")
def get_sources(patent_id: UUID, request: Request, db: Session = Depends(get_db)):
    ensure_publication(patent_id, db)
    sources = db.scalars(
        select(SourceRecord)
        .where(SourceRecord.publication_id == patent_id)
        .order_by(SourceRecord.fetched_at.desc())
    ).all()
    return ok([SourceRecordDto.model_validate(item).model_dump(mode="json") for item in sources], request)


def ensure_publication(patent_id: UUID, db: Session) -> PatentPublication:
    publication = db.scalar(
        select(PatentPublication)
        .options(selectinload(PatentPublication.application))
        .where(PatentPublication.id == patent_id)
    )
    if publication is None:
        raise ApiHttpException(404, "PATENT_NOT_FOUND", "专利不存在")
    return publication


def patent_list_item(item: PatentPublication) -> dict:
    return PatentListItemDto(
        id=item.id,
        family_id=item.application.family_id,
        application_number=item.application.application_number,
        publication_number=item.publication_number,
        country=item.application.country,
        title=item.title,
        publication_date=item.publication_date,
        legal_status=item.legal_status,
        status=item.status.value if hasattr(item.status, "value") else item.status,
    ).model_dump(mode="json")


def family_member(item: PatentFamilyMember) -> dict:
    publication = item.publication
    return FamilyMemberDto(
        id=item.id,
        country=item.country,
        publication_number=publication.publication_number,
        publication_date=publication.publication_date,
        legal_status=publication.legal_status,
    ).model_dump(mode="json")


def patent_detail(item: PatentPublication) -> dict:
    abstract = item.abstracts[0].text if item.abstracts else item.abstract
    description = item.descriptions[0].text if item.descriptions else item.description
    return PatentDetailDto(
        **patent_list_item(item),
        abstract=abstract,
        description=description,
        applicants=[link.applicant.canonical_name for link in item.application.applicants],
        inventors=[link.inventor.canonical_name for link in item.application.inventors],
        classifications=[
            {"scheme": value.scheme, "code": value.code, "raw_code": value.raw_code}
            for value in item.classifications
        ],
        claims=[ClaimDto.model_validate(value).model_dump(mode="json") for value in item.claims],
        family=[family_member(value) for value in item.family_members],
        citations=[
            CitationDto.model_validate(value).model_dump(mode="json") for value in item.citations
        ],
        legal_events=[
            LegalEventDto.model_validate(value).model_dump(mode="json")
            for value in item.legal_events
        ],
        sources=[
            SourceRecordDto.model_validate(value).model_dump(mode="json")
            for value in item.source_records
        ],
    ).model_dump(mode="json")
