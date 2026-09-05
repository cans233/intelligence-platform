from datetime import date, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    Uuid,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base


class PatentStatus(StrEnum):
    DISCOVERED = "DISCOVERED"
    RAW_SAVED = "RAW_SAVED"
    NORMALIZED = "NORMALIZED"
    VALIDATED = "VALIDATED"
    CONFLICT = "CONFLICT"
    PARSED = "PARSED"
    ENRICHED = "ENRICHED"
    INDEXED = "INDEXED"
    ACTIVE = "ACTIVE"
    FAILED = "FAILED"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class PatentFamily(TimestampMixin, Base):
    __tablename__ = "family"
    __table_args__ = {"schema": "patent"}

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    family_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)

    applications: Mapped[list["PatentApplication"]] = relationship(
        back_populates="family", cascade="all, delete-orphan"
    )


class PatentApplication(TimestampMixin, Base):
    __tablename__ = "application"
    __table_args__ = (
        Index("ix_patent_application_family_id", "family_id"),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    family_id: Mapped[str] = mapped_column(
        String(128),
        ForeignKey("patent.family.family_id", ondelete="RESTRICT"),
        nullable=False,
    )
    application_number: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    country: Mapped[str] = mapped_column(String(2), nullable=False)
    filing_date: Mapped[date | None] = mapped_column(Date)

    family: Mapped[PatentFamily] = relationship(back_populates="applications")
    publications: Mapped[list["PatentPublication"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )


class PatentPublication(TimestampMixin, Base):
    __tablename__ = "publication"
    __table_args__ = (
        Index("ix_patent_publication_application_id", "application_id"),
        Index("ix_patent_publication_status", "status"),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    application_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.application.id", ondelete="CASCADE"),
        nullable=False,
    )
    publication_number: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(1000), nullable=False)
    abstract: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    publication_date: Mapped[date | None] = mapped_column(Date)
    legal_status: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[PatentStatus] = mapped_column(
        Enum(
            PatentStatus,
            name="patent_status",
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
        ),
        default=PatentStatus.DISCOVERED,
        server_default=PatentStatus.DISCOVERED.value,
        nullable=False,
    )

    application: Mapped[PatentApplication] = relationship(back_populates="publications")
    claims: Mapped[list["PatentClaim"]] = relationship(
        back_populates="publication", cascade="all, delete-orphan"
    )
    source_records: Mapped[list["SourceRecord"]] = relationship(back_populates="publication")


class PatentClaim(TimestampMixin, Base):
    __tablename__ = "claim"
    __table_args__ = (
        Index("ix_patent_claim_publication_id", "publication_id"),
        UniqueConstraint(
            "publication_id",
            "claim_no",
            name="uq_patent_claim_publication_claim_no",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.publication.id", ondelete="CASCADE"),
        nullable=False,
    )
    claim_no: Mapped[int] = mapped_column(nullable=False)
    claim_type: Mapped[str | None] = mapped_column(String(32))
    text: Mapped[str] = mapped_column(Text, nullable=False)

    publication: Mapped[PatentPublication] = relationship(back_populates="claims")


class SourceRecord(TimestampMixin, Base):
    __tablename__ = "source_record"
    __table_args__ = (
        UniqueConstraint(
            "source_code",
            "source_record_id",
            name="uq_patent_source_record_source_key",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    publication_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.publication.id", ondelete="SET NULL"),
    )
    source_code: Mapped[str] = mapped_column(String(32), nullable=False)
    source_record_id: Mapped[str] = mapped_column(String(256), nullable=False)
    raw_data: Mapped[dict] = mapped_column(JSONB, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    publication: Mapped[PatentPublication | None] = relationship(back_populates="source_records")
