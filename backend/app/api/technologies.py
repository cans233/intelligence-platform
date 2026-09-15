from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db, require_permission
from backend.app.api.errors import ApiHttpException
from backend.app.api.schemas import (
    ProjectPatentDto,
    ReferenceDto,
    TechnologyDetailDto,
    TechnologyListItemDto,
)
from backend.app.models import (
    ProjectTechnology,
    Technology,
    TechnologyPatent,
    PatentPublication,
    User,
)

router = APIRouter(prefix="/technologies", tags=["technologies"])


def technology_options():
    return (
        selectinload(Technology.projects).selectinload(ProjectTechnology.project),
        selectinload(Technology.patents)
        .selectinload(TechnologyPatent.publication)
        .selectinload(PatentPublication.application),
    )


@router.get("")
def list_technologies(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    user: User = Depends(require_permission("technology.read")),
    db: Session = Depends(get_db),
):
    query = select(Technology).options(*technology_options())
    count_query = select(func.count()).select_from(Technology)
    if keyword:
        clause = Technology.name.ilike(f"%{keyword}%")
        query = query.where(clause)
        count_query = count_query.where(clause)
    total = db.scalar(count_query) or 0
    items = db.scalars(
        query.order_by(Technology.name).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return ok(
        {
            "items": [technology_list_item(item) for item in items],
            "page": page,
            "page_size": page_size,
            "total": total,
        },
        request,
    )


@router.get("/{technology_id}")
def get_technology(
    technology_id: UUID,
    request: Request,
    user: User = Depends(require_permission("technology.read")),
    db: Session = Depends(get_db),
):
    technology = db.scalar(
        select(Technology).options(*technology_options()).where(Technology.id == technology_id)
    )
    if technology is None:
        raise ApiHttpException(404, "TECHNOLOGY_NOT_FOUND", "技术不存在")
    return ok(technology_detail(technology), request)


def split_keywords(value: str | None) -> list[str]:
    if not value:
        return []
    return [item.strip() for item in value.replace("，", ",").split(",") if item.strip()]


def technology_list_item(technology: Technology) -> dict:
    return TechnologyListItemDto(
        id=technology.id,
        name=technology.name,
        domain=technology.domain,
        description=technology.description,
        lifecycle_stage=technology.lifecycle_stage,
        keywords=split_keywords(technology.keywords),
        created_at=technology.created_at,
        updated_at=technology.updated_at,
    ).model_dump(mode="json")


def technology_detail(technology: Technology) -> dict:
    patents = []
    for relation in sorted(technology.patents, key=lambda value: value.publication.title):
        publication = relation.publication
        patents.append(
            ProjectPatentDto(
                id=publication.id,
                publication_number=publication.publication_number,
                title=publication.title,
                country=publication.application.country,
                relation_type=relation.relation_type,
                relation_reason=relation.relation_reason,
            )
        )
    return TechnologyDetailDto(
        **technology_list_item(technology),
        projects=[
            ReferenceDto(id=item.project.id, code=item.project.code, name=item.project.name)
            for item in sorted(technology.projects, key=lambda value: value.project.name)
        ],
        patents=patents,
    ).model_dump(mode="json")
