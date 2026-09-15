from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db
from backend.app.api.errors import ApiHttpException
from backend.app.api.schemas import (
    CitationDirectionsDto,
    CitationDto,
    ClaimDto,
    ClassificationDto,
    FamilyMemberDto,
    LegalEventDto,
    PatentDetailDto,
    PatentListItemDto,
    PersonDto,
    SourceRecordDto,
)
from backend.app.models import (
    ApplicationApplicant,
    ApplicationInventor,
    PatentAbstract,
    PatentApplication,
    PatentCitation,
    PatentClaim,
    PatentDescription,
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
    query = (
        select(PatentPublication)
        .join(PatentPublication.application)
        .options(
            selectinload(PatentPublication.application)
            .selectinload(PatentApplication.applicants)
            .selectinload(ApplicationApplicant.applicant),
            selectinload(PatentPublication.classifications),
            selectinload(PatentPublication.source_records),
        )
    )
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
    return ok(
        {
            "items": [patent_list_item(item) for item in items],
            "page": page,
            "page_size": page_size,
            "total": total,
        },
        request,
    )


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
            selectinload(PatentPublication.application)
            .selectinload(PatentApplication.priorities),
            selectinload(PatentPublication.claims),
            selectinload(PatentPublication.abstracts),
            selectinload(PatentPublication.descriptions),
            selectinload(PatentPublication.classifications),
            selectinload(PatentPublication.family_members)
            .selectinload(PatentFamilyMember.publication),
            selectinload(PatentPublication.citations),
            selectinload(PatentPublication.legal_events),
            selectinload(PatentPublication.source_records),
        )
        .where(PatentPublication.id == patent_id)
    )
    if publication is None:
        raise ApiHttpException(404, "PATENT_NOT_FOUND", "专利不存在")
    return ok(patent_detail(publication, db), request)


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
        .order_by(PatentFamilyMember.country, PatentFamilyMember.publication_id)
    ).all()
    return ok([family_member(item) for item in members], request)


@router.get("/{patent_id}/citations")
def get_citations(patent_id: UUID, request: Request, db: Session = Depends(get_db)):
    ensure_publication(patent_id, db)
    references = db.scalars(
        select(PatentCitation)
        .options(selectinload(PatentCitation.citing_publication))
        .where(PatentCitation.citing_publication_id == patent_id)
        .order_by(PatentCitation.created_at)
    ).all()
    cited_by = db.scalars(
        select(PatentCitation)
        .options(selectinload(PatentCitation.citing_publication))
        .where(PatentCitation.cited_publication_id == patent_id)
        .order_by(PatentCitation.created_at)
    ).all()
    data = CitationDirectionsDto(
        references=[citation_dto(item) for item in references],
        cited_by=[citation_dto(item) for item in cited_by],
    )
    return ok(data.model_dump(mode="json"), request)


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
    classifications = getattr(item, "classifications", [])
    return PatentListItemDto(
        id=item.id,
        family_id=item.application.family_id,
        title=item.title,
        publication_number=item.publication_number,
        application_number=item.application.application_number,
        country=item.application.country,
        applicant_names=[
            link.applicant.canonical_name
            for link in sorted(item.application.applicants, key=lambda value: value.display_order)
        ],
        publication_date=item.publication_date,
        ipc_codes=[value.code for value in classifications if value.scheme.upper() == "IPC"],
        cpc_codes=[value.code for value in classifications if value.scheme.upper() == "CPC"],
        legal_status=item.legal_status,
        status=item.status.value if hasattr(item.status, "value") else item.status,
        source_codes=sorted({value.source_code for value in getattr(item, "source_records", [])}),
        updated_at=item.updated_at,
    ).model_dump(mode="json")


def family_member(item: PatentFamilyMember) -> dict:
    publication = item.publication
    return FamilyMemberDto(
        id=item.id,
        publication_id=publication.id,
        country=item.country,
        publication_number=publication.publication_number,
        publication_date=publication.publication_date,
        legal_status=publication.legal_status,
    ).model_dump(mode="json")


def citation_dto(item: PatentCitation) -> CitationDto:
    return CitationDto(
        id=item.id,
        citing_publication_id=item.citing_publication_id,
        citing_publication_number=(
            item.citing_publication.publication_number
            if item.citing_publication is not None
            else None
        ),
        citation_type=item.citation_type,
        cited_publication_number=item.cited_publication_number,
        cited_publication_id=item.cited_publication_id,
    )


def patent_detail(item: PatentPublication, db: Session) -> dict:
    abstract = item.abstracts[0].text if item.abstracts else item.abstract
    description = item.descriptions[0].text if item.descriptions else item.description
    priority_dates = [value.priority_date for value in item.application.priorities if value.priority_date]
    citations = db.scalars(
        select(PatentCitation)
        .options(selectinload(PatentCitation.citing_publication))
        .where(
            or_(
                PatentCitation.citing_publication_id == item.id,
                PatentCitation.cited_publication_id == item.id,
            )
        )
        .order_by(PatentCitation.created_at)
    ).all()
    family_members = db.scalars(
        select(PatentFamilyMember)
        .options(selectinload(PatentFamilyMember.publication))
        .where(PatentFamilyMember.family_id == item.application.family_id)
        .order_by(PatentFamilyMember.country, PatentFamilyMember.publication_id)
    ).all()
    return PatentDetailDto(
        **patent_list_item(item),
        filing_date=item.application.filing_date,
        priority_date=min(priority_dates) if priority_dates else None,
        abstract=abstract,
        description=description,
        applicants=[
            PersonDto(
                id=link.applicant.id,
                name=link.applicant.canonical_name,
                country=link.applicant.country,
            )
            for link in sorted(item.application.applicants, key=lambda value: value.display_order)
        ],
        inventors=[
            PersonDto(
                id=link.inventor.id,
                name=link.inventor.canonical_name,
                country=link.inventor.country,
            )
            for link in sorted(item.application.inventors, key=lambda value: value.display_order)
        ],
        classifications=[ClassificationDto.model_validate(value) for value in item.classifications],
        claims=[
            ClaimDto.model_validate(value)
            for value in sorted(item.claims, key=lambda claim: claim.claim_no)
        ],
        family_members=[family_member(value) for value in family_members],
        citations=CitationDirectionsDto(
            references=[
                citation_dto(value)
                for value in citations
                if value.citing_publication_id == item.id
            ],
            cited_by=[
                citation_dto(value)
                for value in citations
                if value.cited_publication_id == item.id
            ],
        ),
        legal_events=[
            LegalEventDto.model_validate(value)
            for value in sorted(item.legal_events, key=lambda event: event.event_date)
        ],
        sources=[
            SourceRecordDto.model_validate(value)
            for value in sorted(item.source_records, key=lambda source: source.fetched_at, reverse=True)
        ],
        normalized_fields={},
        ai_enhancements={},
        human_conclusions={},
        discovery_path=[],
        created_at=item.created_at,
    ).model_dump(mode="json")
