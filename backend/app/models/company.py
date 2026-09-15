from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, Uuid, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base


class Organization(Base):
    __tablename__ = "organization"
    __table_args__ = {"schema": "company"}

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    code: Mapped[str | None] = mapped_column(String(64), unique=True)

    departments: Mapped[list["Department"]] = relationship(
        back_populates="organization", cascade="all, delete-orphan"
    )
    projects: Mapped[list["Project"]] = relationship(back_populates="organization")


class Department(Base):
    __tablename__ = "department"
    __table_args__ = (
        Index("ix_company_department_organization_id", "organization_id"),
        UniqueConstraint("organization_id", "name", name="uq_company_department_name"),
        {"schema": "company"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.organization.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    code: Mapped[str | None] = mapped_column(String(64))

    organization: Mapped[Organization] = relationship(back_populates="departments")
    projects: Mapped[list["Project"]] = relationship(back_populates="department")


class Project(Base):
    __tablename__ = "project"
    __table_args__ = (
        Index("ix_company_project_department_id", "department_id"),
        Index("ix_company_project_status", "status"),
        {"schema": "company"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    organization_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.organization.id", ondelete="RESTRICT"), nullable=False
    )
    department_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.department.id", ondelete="SET NULL")
    )
    owner_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("system.user.id", ondelete="SET NULL")
    )
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    classification: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    organization: Mapped[Organization] = relationship(back_populates="projects")
    department: Mapped[Department | None] = relationship(back_populates="projects")
    owner: Mapped["User | None"] = relationship(foreign_keys=[owner_id])
    technologies: Mapped[list["ProjectTechnology"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    patents: Mapped[list["ProjectPatent"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    documents: Mapped[list["ProjectDocument"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class Technology(Base):
    __tablename__ = "technology"
    __table_args__ = (
        Index("ix_company_technology_domain", "domain"),
        {"schema": "company"},
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    domain: Mapped[str | None] = mapped_column(String(128))
    description: Mapped[str | None] = mapped_column(Text)
    lifecycle_stage: Mapped[str | None] = mapped_column(String(64))
    keywords: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    projects: Mapped[list["ProjectTechnology"]] = relationship(
        back_populates="technology", cascade="all, delete-orphan"
    )
    patents: Mapped[list["TechnologyPatent"]] = relationship(
        back_populates="technology", cascade="all, delete-orphan"
    )


class ProjectTechnology(Base):
    __tablename__ = "project_technology"
    __table_args__ = (
        UniqueConstraint("project_id", "technology_id", name="uq_company_project_technology"),
        {"schema": "company"},
    )

    project_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.project.id", ondelete="CASCADE"), primary_key=True
    )
    technology_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.technology.id", ondelete="CASCADE"), primary_key=True
    )
    relation_type: Mapped[str] = mapped_column(String(32), nullable=False, default="CORE")
    relevance_note: Mapped[str | None] = mapped_column(Text)

    project: Mapped[Project] = relationship(back_populates="technologies")
    technology: Mapped[Technology] = relationship(back_populates="projects")


class ProjectPatent(Base):
    __tablename__ = "project_patent"
    __table_args__ = (
        Index("ix_company_project_patent_patent_id", "publication_id"),
        UniqueConstraint("project_id", "publication_id", name="uq_company_project_patent"),
        {"schema": "company"},
    )

    project_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.project.id", ondelete="CASCADE"), primary_key=True
    )
    publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.publication.id", ondelete="CASCADE"), primary_key=True
    )
    relation_type: Mapped[str] = mapped_column(String(32), nullable=False, default="RELATED")
    relevance_score: Mapped[int | None] = mapped_column(Integer)
    relation_reason: Mapped[str | None] = mapped_column(Text)

    project: Mapped[Project] = relationship(back_populates="patents")
    publication: Mapped["PatentPublication"] = relationship()


class TechnologyPatent(Base):
    __tablename__ = "technology_patent"
    __table_args__ = (
        Index("ix_company_technology_patent_patent_id", "publication_id"),
        UniqueConstraint("technology_id", "publication_id", name="uq_company_technology_patent"),
        {"schema": "company"},
    )

    technology_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.technology.id", ondelete="CASCADE"), primary_key=True
    )
    publication_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("patent.publication.id", ondelete="CASCADE"), primary_key=True
    )
    relation_type: Mapped[str] = mapped_column(String(32), nullable=False, default="RELATED")
    relation_reason: Mapped[str | None] = mapped_column(Text)

    technology: Mapped[Technology] = relationship(back_populates="patents")
    publication: Mapped["PatentPublication"] = relationship()


class ProjectDocument(Base):
    __tablename__ = "project_document"
    __table_args__ = (
        UniqueConstraint("project_id", "document_id", name="uq_company_project_document"),
        {"schema": "company"},
    )

    project_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("company.project.id", ondelete="CASCADE"), primary_key=True
    )
    document_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("document.document.id", ondelete="CASCADE"), primary_key=True
    )
    relation_type: Mapped[str] = mapped_column(String(32), nullable=False, default="REFERENCE")

    project: Mapped[Project] = relationship(back_populates="documents")
    document: Mapped["Document"] = relationship()
