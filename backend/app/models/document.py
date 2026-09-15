from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, Uuid, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base


class DocumentStatus(StrEnum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DELETED = "DELETED"


class ParseStatus(StrEnum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"


class Document(Base):
    __tablename__ = "document"
    __table_args__ = (
        Index("ix_document_project_id", "project_id"),
        Index("ix_document_uploaded_by", "uploaded_by"),
        {"schema": "document"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    project_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.project.id", ondelete="SET NULL")
    )
    uploaded_by: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("system.user.id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(32), nullable=False)
    storage_location: Mapped[str] = mapped_column(String(1024), nullable=False)
    status: Mapped[DocumentStatus] = mapped_column(
        String(32), nullable=False, default=DocumentStatus.ACTIVE, server_default="ACTIVE"
    )
    confidentiality: Mapped[str] = mapped_column(
        String(32), nullable=False, default="INTERNAL", server_default="INTERNAL"
    )
    current_version_no: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    versions: Mapped[list["DocumentVersion"]] = relationship(
        back_populates="document", cascade="all, delete-orphan", order_by="DocumentVersion.version_no"
    )
    project: Mapped["Project | None"] = relationship()
    uploaded_user: Mapped["User"] = relationship(foreign_keys=[uploaded_by])


class DocumentVersion(Base):
    __tablename__ = "document_version"
    __table_args__ = (
        Index("ix_document_version_document_id", "document_id"),
        UniqueConstraint("document_id", "version_no", name="uq_document_version_number"),
        UniqueConstraint("checksum", name="uq_document_version_checksum"),
        {"schema": "document"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    document_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("document.document.id", ondelete="CASCADE"), nullable=False
    )
    version_no: Mapped[int] = mapped_column(Integer, nullable=False)
    file_type: Mapped[str] = mapped_column(String(32), nullable=False)
    storage_location: Mapped[str] = mapped_column(String(1024), nullable=False)
    checksum: Mapped[str | None] = mapped_column(String(128))
    file_size_bytes: Mapped[int | None] = mapped_column(Integer)
    uploaded_by: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("system.user.id", ondelete="RESTRICT"), nullable=False
    )
    parse_status: Mapped[ParseStatus] = mapped_column(
        String(32), nullable=False, default=ParseStatus.PENDING, server_default="PENDING"
    )
    parse_error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    document: Mapped[Document] = relationship(back_populates="versions")
    parsed_contents: Mapped[list["ParsedContent"]] = relationship(
        back_populates="version", cascade="all, delete-orphan"
    )


class ParsedContent(Base):
    __tablename__ = "parsed_content"
    __table_args__ = (
        Index("ix_document_parsed_content_version_id", "document_version_id"),
        UniqueConstraint(
            "document_version_id",
            "content_type",
            name="uq_document_parsed_content_type",
        ),
        {"schema": "document"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    document_version_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("document.document_version.id", ondelete="CASCADE"),
        nullable=False,
    )
    content_type: Mapped[str] = mapped_column(String(32), nullable=False, default="TEXT")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    parser_name: Mapped[str | None] = mapped_column(String(128))
    parser_version: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    version: Mapped[DocumentVersion] = relationship(back_populates="parsed_contents")
