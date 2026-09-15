from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db, require_permission
from backend.app.api.errors import ApiHttpException
from backend.app.api.schemas import (
    DocumentCreate,
    DocumentDetailDto,
    DocumentListItemDto,
    DocumentVersionDto,
    ReferenceDto,
)
from backend.app.models import Document, DocumentVersion, User

router = APIRouter(prefix="/documents", tags=["documents"])


def document_options():
    return (
        selectinload(Document.project),
        selectinload(Document.uploaded_user),
        selectinload(Document.versions),
    )


@router.post("")
def create_document(
    payload: DocumentCreate,
    request: Request,
    user: User = Depends(require_permission("document.write")),
    db: Session = Depends(get_db),
):
    document = Document(**payload.model_dump(), uploaded_by=user.id)
    db.add(document)
    db.commit()
    document = db.scalar(select(Document).options(*document_options()).where(Document.id == document.id))
    return ok(document_detail(document), request)


@router.get("")
def list_documents(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    user: User = Depends(require_permission("document.read")),
    db: Session = Depends(get_db),
):
    query = select(Document).options(*document_options())
    count_query = select(func.count()).select_from(Document)
    if keyword:
        clause = or_(
            Document.name.ilike(f"%{keyword}%"),
            Document.file_type.ilike(f"%{keyword}%"),
        )
        query = query.where(clause)
        count_query = count_query.where(clause)
    total = db.scalar(count_query) or 0
    items = db.scalars(
        query.order_by(Document.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)
    ).all()
    return ok(
        {
            "items": [document_list_item(item) for item in items],
            "page": page,
            "page_size": page_size,
            "total": total,
        },
        request,
    )


@router.get("/{document_id}")
def get_document(
    document_id: UUID,
    request: Request,
    user: User = Depends(require_permission("document.read")),
    db: Session = Depends(get_db),
):
    document = db.scalar(
        select(Document).options(*document_options()).where(Document.id == document_id)
    )
    if document is None:
        raise ApiHttpException(404, "DOCUMENT_NOT_FOUND", "文档不存在")
    return ok(document_detail(document), request)


@router.get("/{document_id}/versions")
def get_versions(
    document_id: UUID,
    request: Request,
    user: User = Depends(require_permission("document.read")),
    db: Session = Depends(get_db),
):
    if db.get(Document, document_id) is None:
        raise ApiHttpException(404, "DOCUMENT_NOT_FOUND", "文档不存在")
    versions = db.scalars(
        select(DocumentVersion)
        .where(DocumentVersion.document_id == document_id)
        .order_by(DocumentVersion.version_no.desc())
    ).all()
    return ok([version_dto(item) for item in versions], request)


def document_list_item(document: Document) -> dict:
    return DocumentListItemDto(
        id=document.id,
        name=document.name,
        project=(
            ReferenceDto(
                id=document.project.id,
                code=document.project.code,
                name=document.project.name,
            )
            if document.project
            else None
        ),
        uploaded_by=ReferenceDto(
            id=document.uploaded_user.id,
            name=document.uploaded_user.display_name,
        ),
        file_type=document.file_type,
        storage_location=document.storage_location,
        status=document.status.value if hasattr(document.status, "value") else document.status,
        confidentiality=document.confidentiality,
        current_version_no=document.current_version_no,
        created_at=document.created_at,
        updated_at=document.updated_at,
    ).model_dump(mode="json")


def version_dto(version: DocumentVersion) -> dict:
    return DocumentVersionDto.model_validate(version).model_dump(mode="json")


def document_detail(document: Document) -> dict:
    return DocumentDetailDto(
        **document_list_item(document),
        versions=[
            DocumentVersionDto.model_validate(item)
            for item in sorted(document.versions, key=lambda value: value.version_no, reverse=True)
        ],
    ).model_dump(mode="json")
