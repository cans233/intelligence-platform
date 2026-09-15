from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db, require_permission
from backend.app.api.schemas import JobDto
from backend.app.models import Job, User

router = APIRouter(tags=["system"])


@router.get("/jobs")
def list_jobs(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    user: User = Depends(require_permission("job.read")),
    db: Session = Depends(get_db),
):
    query = select(Job)
    count_query = select(func.count()).select_from(Job)
    if status:
        query = query.where(Job.status == status.upper())
        count_query = count_query.where(Job.status == status.upper())
    total = db.scalar(count_query) or 0
    items = db.scalars(query.order_by(Job.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return ok(
        {
            "items": [JobDto.model_validate(item).model_dump(mode="json") for item in items],
            "page": page,
            "page_size": page_size,
            "total": total,
        },
        request,
    )
