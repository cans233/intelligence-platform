from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from backend.app.api.common import ok
from backend.app.api.dependencies import get_db, require_permission
from backend.app.api.errors import ApiHttpException
from backend.app.api.schemas import DocumentCreate, DocumentDto, DocumentVersionDto
from backend.app.models import Document, DocumentVersion, User

router = APIRouter(prefix="/documents", tags=["documents"])


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
    db.refresh(document)
    return ok(document_dto(document), request)


@router.get("")
def list_documents(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    keyword: str | None = None,
    user: User = Depends(require_permission("document.read")),
    db: Session = Depends(get_db),
):
    query = select(Document)
    count_query = select(func.count()).select_from(Document)
    if keyword:
        clause = or_(Document.name.ilike(f"%{keyword}%"), Document.file_type.ilike(f"%{keyword}%"))
        query = query.where(clause)
        count_query = count_query.where(clause)
    total = db.scalar(count_query) or 0
    items = db.scalars(query.order_by(Document.updated_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
    return ok(
        {"items": [document_dto(item) for item in items], "page": page, "page_size": page_size, "total": total},
        request,
    )


@router.get("/{document_id}")
def get_document(
    document_id: UUID,
    request: Request,
    user: User = Depends(require_permission("document.read")),
    db: Session = Depends(get_db),
):
    document = db.get(Document, document_id)
    if document is None:
        raise ApiHttpException(404, "DOCUMENT_NOT_FOUND", "文档不存在")
    return ok(document_dto(document), request)


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
    return ok([DocumentVersionDto.model_validate(item).model_dump(mode="json") for item in versions], request)


def document_dto(document: Document) -> dict:
    return DocumentDto.model_validate(document).model_dump(mode="json")
