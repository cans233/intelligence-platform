from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db, require_permission
from backend.app.api.errors import ApiHttpException
from backend.app.api.schemas import ProjectCreate, ProjectDto, ProjectPatch
from backend.app.models import Project, User

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
def list_projects(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    user: User = Depends(require_permission("project.read")),
    db: Session = Depends(get_db),
):
    query = select(Project)
    count_query = select(func.count()).select_from(Project)
    if keyword:
        pattern = f"%{keyword}%"
        clause = or_(Project.name.ilike(pattern), Project.code.ilike(pattern))
        query = query.where(clause)
        count_query = count_query.where(clause)
    total = db.scalar(count_query) or 0
    items = db.scalars(query.order_by(Project.name).offset((page - 1) * page_size).limit(page_size)).all()
    return ok(
        {"items": [project_dto(item) for item in items], "page": page, "page_size": page_size, "total": total},
        request,
    )


@router.post("")
def create_project(
    payload: ProjectCreate,
    request: Request,
    user: User = Depends(require_permission("project.write")),
    db: Session = Depends(get_db),
):
    if db.scalar(select(Project.id).where(Project.code == payload.code)) is not None:
        raise ApiHttpException(409, "PROJECT_EXISTS", "项目编号已存在")
    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return ok(project_dto(project), request)


@router.get("/{project_id}")
def get_project(
    project_id: UUID,
    request: Request,
    user: User = Depends(require_permission("project.read")),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if project is None:
        raise ApiHttpException(404, "PROJECT_NOT_FOUND", "项目不存在")
    return ok(project_dto(project), request)


@router.patch("/{project_id}")
def patch_project(
    project_id: UUID,
    payload: ProjectPatch,
    request: Request,
    user: User = Depends(require_permission("project.write")),
    db: Session = Depends(get_db),
):
    project = db.get(Project, project_id)
    if project is None:
        raise ApiHttpException(404, "PROJECT_NOT_FOUND", "项目不存在")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return ok(project_dto(project), request)


def project_dto(project: Project) -> dict:
    return ProjectDto.model_validate(project).model_dump(mode="json")
