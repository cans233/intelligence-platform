from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db, require_permission
from backend.app.api.errors import ApiHttpException
from backend.app.api.schemas import (
    ProjectCreate,
    ProjectDetailDto,
    ProjectDocumentDto,
    ProjectListItemDto,
    ProjectPatch,
    ProjectPatentDto,
    ReferenceDto,
)
from backend.app.models import (
    Project,
    ProjectDocument,
    ProjectPatent,
    ProjectTechnology,
    PatentPublication,
    User,
)

router = APIRouter(prefix="/projects", tags=["projects"])


def project_options():
    return (
        selectinload(Project.organization),
        selectinload(Project.department),
        selectinload(Project.owner),
        selectinload(Project.technologies).selectinload(ProjectTechnology.technology),
        selectinload(Project.patents)
        .selectinload(ProjectPatent.publication)
        .selectinload(PatentPublication.application),
        selectinload(Project.documents).selectinload(ProjectDocument.document),
    )


@router.get("")
def list_projects(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    user: User = Depends(require_permission("project.read")),
    db: Session = Depends(get_db),
):
    query = select(Project).options(*project_options())
    count_query = select(func.count()).select_from(Project)
    if keyword:
        pattern = f"%{keyword}%"
        clause = or_(Project.name.ilike(pattern), Project.code.ilike(pattern))
        query = query.where(clause)
        count_query = count_query.where(clause)
    total = db.scalar(count_query) or 0
    items = db.scalars(
        query.order_by(Project.name).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return ok(
        {
            "items": [project_list_item(item) for item in items],
            "page": page,
            "page_size": page_size,
            "total": total,
        },
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
    project = db.scalar(select(Project).options(*project_options()).where(Project.id == project.id))
    return ok(project_detail(project), request)


@router.get("/{project_id}")
def get_project(
    project_id: UUID,
    request: Request,
    user: User = Depends(require_permission("project.read")),
    db: Session = Depends(get_db),
):
    project = db.scalar(select(Project).options(*project_options()).where(Project.id == project_id))
    if project is None:
        raise ApiHttpException(404, "PROJECT_NOT_FOUND", "项目不存在")
    return ok(project_detail(project), request)


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
    project = db.scalar(select(Project).options(*project_options()).where(Project.id == project_id))
    return ok(project_detail(project), request)


def reference(entity, *, code_attr: str | None = "code") -> ReferenceDto:
    return ReferenceDto(
        id=entity.id,
        code=getattr(entity, code_attr, None) if code_attr else None,
        name=entity.name if hasattr(entity, "name") else entity.display_name,
    )


def project_list_item(project: Project) -> dict:
    return ProjectListItemDto(
        id=project.id,
        code=project.code,
        name=project.name,
        description=project.description,
        status=project.status,
        organization=reference(project.organization),
        department=reference(project.department) if project.department else None,
        owner=reference(project.owner, code_attr=None) if project.owner else None,
        technologies=[
            reference(item.technology)
            for item in sorted(project.technologies, key=lambda value: value.technology.name)
        ],
        created_at=project.created_at,
        updated_at=project.updated_at,
    ).model_dump(mode="json")


def project_patent(item: ProjectPatent) -> ProjectPatentDto:
    publication = item.publication
    return ProjectPatentDto(
        id=publication.id,
        publication_number=publication.publication_number,
        title=publication.title,
        country=publication.application.country,
        relation_type=item.relation_type,
        relevance_score=item.relevance_score,
        relation_reason=item.relation_reason,
    )


def project_detail(project: Project) -> dict:
    data = ProjectDetailDto(
        **project_list_item(project),
        documents=[
            ProjectDocumentDto(
                id=item.document.id,
                name=item.document.name,
                file_type=item.document.file_type,
                status=item.document.status.value
                if hasattr(item.document.status, "value")
                else item.document.status,
                current_version_no=item.document.current_version_no,
            )
            for item in sorted(project.documents, key=lambda value: value.document.name)
        ],
        company_patents=[
            project_patent(item)
            for item in sorted(project.patents, key=lambda value: value.publication.title)
        ],
        # No separate external-relation fact exists in the Phase 2 schema.
        external_related_patents=[],
    )
    return data.model_dump(mode="json")
