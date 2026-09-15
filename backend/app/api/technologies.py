from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db, require_permission
from backend.app.api.errors import ApiHttpException
from backend.app.api.schemas import TechnologyDto
from backend.app.models import Technology, User

router = APIRouter(prefix="/technologies", tags=["technologies"])


@router.get("")
def list_technologies(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    user: User = Depends(require_permission("technology.read")),
    db: Session = Depends(get_db),
):
    query = select(Technology)
    count_query = select(func.count()).select_from(Technology)
    if keyword:
        clause = Technology.name.ilike(f"%{keyword}%")
        query = query.where(clause)
        count_query = count_query.where(clause)
    total = db.scalar(count_query) or 0
    items = db.scalars(query.order_by(Technology.name).offset((page - 1) * page_size).limit(page_size)).all()
    return ok(
        {"items": [technology_dto(item) for item in items], "page": page, "page_size": page_size, "total": total},
        request,
    )


@router.get("/{technology_id}")
def get_technology(
    technology_id: UUID,
    request: Request,
    user: User = Depends(require_permission("technology.read")),
    db: Session = Depends(get_db),
):
    technology = db.get(Technology, technology_id)
    if technology is None:
        raise ApiHttpException(404, "TECHNOLOGY_NOT_FOUND", "技术不存在")
    return ok(technology_dto(technology), request)


def technology_dto(technology: Technology) -> dict:
    return TechnologyDto.model_validate(technology).model_dump(mode="json")
