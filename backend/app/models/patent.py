from datetime import date, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
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
    members: Mapped[list["PatentFamilyMember"]] = relationship(
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
    applicants: Mapped[list["ApplicationApplicant"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    inventors: Mapped[list["ApplicationInventor"]] = relationship(
        back_populates="application", cascade="all, delete-orphan"
    )
    priorities: Mapped[list["PatentPriority"]] = relationship(
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
    # Compatibility fallback only. New writes belong in patent.abstract/description.
    # TODO Phase 3: backfill, keep a compatibility window, then remove these legacy columns.
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
    abstracts: Mapped[list["PatentAbstract"]] = relationship(
        back_populates="publication", cascade="all, delete-orphan"
    )
    descriptions: Mapped[list["PatentDescription"]] = relationship(
        back_populates="publication", cascade="all, delete-orphan"
    )
    classifications: Mapped[list["PatentClassification"]] = relationship(
        back_populates="publication", cascade="all, delete-orphan"
    )
    legal_events: Mapped[list["PatentLegalEvent"]] = relationship(
        back_populates="publication", cascade="all, delete-orphan"
    )
    citations: Mapped[list["PatentCitation"]] = relationship(
        back_populates="citing_publication",
        foreign_keys="PatentCitation.citing_publication_id",
        cascade="all, delete-orphan",
    )
    family_members: Mapped[list["PatentFamilyMember"]] = relationship(
        back_populates="publication"
    )


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
    claim_no: Mapped[int] = mapped_column(Integer, nullable=False)
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


class PatentAbstract(TimestampMixin, Base):
    __tablename__ = "abstract"
    __table_args__ = (
        Index("ix_patent_abstract_publication_id", "publication_id"),
        UniqueConstraint(
            "publication_id",
            "language",
            name="uq_patent_abstract_publication_language",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.publication.id", ondelete="CASCADE"),
        nullable=False,
    )
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="und")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.source_record.id", ondelete="SET NULL")
    )

    publication: Mapped[PatentPublication] = relationship(back_populates="abstracts")


class PatentDescription(TimestampMixin, Base):
    __tablename__ = "description"
    __table_args__ = (
        Index("ix_patent_description_publication_id", "publication_id"),
        UniqueConstraint(
            "publication_id",
            "language",
            name="uq_patent_description_publication_language",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.publication.id", ondelete="CASCADE"),
        nullable=False,
    )
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="und")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    source_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.source_record.id", ondelete="SET NULL")
    )

    publication: Mapped[PatentPublication] = relationship(back_populates="descriptions")


class PatentApplicant(TimestampMixin, Base):
    __tablename__ = "applicant"
    __table_args__ = (
        Index("ix_patent_applicant_canonical_name", "canonical_name"),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    canonical_name: Mapped[str] = mapped_column(String(512), nullable=False)
    country: Mapped[str | None] = mapped_column(String(2))
    external_entity_key: Mapped[str | None] = mapped_column(String(256), unique=True)

    applications: Mapped[list["ApplicationApplicant"]] = relationship(
        back_populates="applicant", cascade="all, delete-orphan"
    )


class PatentInventor(TimestampMixin, Base):
    __tablename__ = "inventor"
    __table_args__ = (
        Index("ix_patent_inventor_canonical_name", "canonical_name"),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    canonical_name: Mapped[str] = mapped_column(String(512), nullable=False)
    country: Mapped[str | None] = mapped_column(String(2))
    external_entity_key: Mapped[str | None] = mapped_column(String(256), unique=True)

    applications: Mapped[list["ApplicationInventor"]] = relationship(
        back_populates="inventor", cascade="all, delete-orphan"
    )


class ApplicationApplicant(TimestampMixin, Base):
    __tablename__ = "application_applicant"
    __table_args__ = (
        Index("ix_patent_application_applicant_applicant_id", "applicant_id"),
        UniqueConstraint(
            "application_id",
            "applicant_id",
            "role",
            name="uq_patent_application_applicant_role",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    application_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.application.id", ondelete="CASCADE"),
        nullable=False,
    )
    applicant_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.applicant.id", ondelete="RESTRICT"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="APPLICANT")
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    application: Mapped[PatentApplication] = relationship(back_populates="applicants")
    applicant: Mapped[PatentApplicant] = relationship(back_populates="applications")


class ApplicationInventor(TimestampMixin, Base):
    __tablename__ = "application_inventor"
    __table_args__ = (
        Index("ix_patent_application_inventor_inventor_id", "inventor_id"),
        UniqueConstraint(
            "application_id",
            "inventor_id",
            name="uq_patent_application_inventor",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    application_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.application.id", ondelete="CASCADE"),
        nullable=False,
    )
    inventor_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.inventor.id", ondelete="RESTRICT"),
        nullable=False,
    )
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    application: Mapped[PatentApplication] = relationship(back_populates="inventors")
    inventor: Mapped[PatentInventor] = relationship(back_populates="applications")


class PatentClassification(TimestampMixin, Base):
    __tablename__ = "classification"
    __table_args__ = (
        Index("ix_patent_classification_publication_id", "publication_id"),
        Index("ix_patent_classification_code", "scheme", "code"),
        UniqueConstraint(
            "publication_id",
            "scheme",
            "code",
            name="uq_patent_classification_publication_code",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.publication.id", ondelete="CASCADE"),
        nullable=False,
    )
    scheme: Mapped[str] = mapped_column(String(16), nullable=False)
    code: Mapped[str] = mapped_column(String(64), nullable=False)
    raw_code: Mapped[str | None] = mapped_column(String(128))
    source_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.source_record.id", ondelete="SET NULL")
    )

    publication: Mapped[PatentPublication] = relationship(back_populates="classifications")


class PatentPriority(TimestampMixin, Base):
    __tablename__ = "priority"
    __table_args__ = (
        Index("ix_patent_priority_application_id", "application_id"),
        UniqueConstraint(
            "application_id",
            "priority_number",
            name="uq_patent_priority_application_number",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    application_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.application.id", ondelete="CASCADE"),
        nullable=False,
    )
    priority_number: Mapped[str] = mapped_column(String(128), nullable=False)
    country: Mapped[str | None] = mapped_column(String(2))
    priority_date: Mapped[date | None] = mapped_column(Date)
    source_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.source_record.id", ondelete="SET NULL")
    )

    application: Mapped[PatentApplication] = relationship(back_populates="priorities")


class PatentCitation(TimestampMixin, Base):
    __tablename__ = "citation"
    __table_args__ = (
        Index("ix_patent_citation_citing_publication_id", "citing_publication_id"),
        Index("ix_patent_citation_cited_publication_id", "cited_publication_id"),
        UniqueConstraint(
            "citing_publication_id",
            "cited_publication_id",
            "cited_publication_number",
            name="uq_patent_citation_edge",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    citing_publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.publication.id", ondelete="CASCADE"),
        nullable=False,
    )
    cited_publication_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.publication.id", ondelete="SET NULL")
    )
    cited_publication_number: Mapped[str | None] = mapped_column(String(128))
    citation_type: Mapped[str] = mapped_column(String(32), nullable=False, default="BACKWARD")
    source_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.source_record.id", ondelete="SET NULL")
    )

    citing_publication: Mapped[PatentPublication] = relationship(
        back_populates="citations", foreign_keys=[citing_publication_id]
    )


class PatentLegalEvent(TimestampMixin, Base):
    __tablename__ = "legal_event"
    __table_args__ = (
        Index("ix_patent_legal_event_publication_date", "publication_id", "event_date"),
        UniqueConstraint(
            "publication_id",
            "event_date",
            "event_code",
            "source_record_id",
            name="uq_patent_legal_event_identity",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.publication.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    event_code: Mapped[str] = mapped_column(String(64), nullable=False)
    event_description: Mapped[str] = mapped_column(Text, nullable=False)
    legal_status: Mapped[str | None] = mapped_column(String(64))
    source_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.source_record.id", ondelete="SET NULL")
    )

    publication: Mapped[PatentPublication] = relationship(back_populates="legal_events")


class PatentFamilyMember(TimestampMixin, Base):
    __tablename__ = "family_member"
    __table_args__ = (
        Index("ix_patent_family_member_family_id", "family_id"),
        UniqueConstraint(
            "family_id",
            "publication_id",
            name="uq_patent_family_member_publication",
        ),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    family_id: Mapped[str] = mapped_column(
        String(128),
        ForeignKey("patent.family.family_id", ondelete="CASCADE"),
        nullable=False,
    )
    publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("patent.publication.id", ondelete="CASCADE"),
        nullable=False,
    )
    country: Mapped[str] = mapped_column(String(2), nullable=False)
    member_role: Mapped[str | None] = mapped_column(String(32))

    family: Mapped[PatentFamily] = relationship(back_populates="members")
    publication: Mapped[PatentPublication] = relationship(back_populates="family_members")


class PatentFieldProvenance(TimestampMixin, Base):
    __tablename__ = "field_provenance"
    __table_args__ = (
        Index("ix_patent_field_provenance_entity", "entity_type", "entity_id"),
        {"schema": "patent"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), nullable=False)
    field_name: Mapped[str] = mapped_column(String(128), nullable=False)
    canonical_value: Mapped[str | None] = mapped_column(Text)
    source_record_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.source_record.id", ondelete="SET NULL")
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    confidence: Mapped[str | None] = mapped_column(String(32))
    conflict_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="NONE", server_default="NONE"
    )
