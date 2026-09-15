"""Add phase two fact, document, company and RBAC tables.

Revision ID: 0002_phase2_core_facts
Revises: 0001_phase1_patent_foundation
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0002_phase2_core_facts"
down_revision: Union[str, Sequence[str], None] = "0001_phase1_patent_foundation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _id() -> sa.Column:
    return sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False)


def _timestamps() -> tuple[sa.Column, sa.Column]:
    return (
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def _create_schema(name: str) -> None:
    op.execute(f"CREATE SCHEMA IF NOT EXISTS {name}")


def upgrade() -> None:
    for schema in ("system", "company", "document"):
        _create_schema(schema)

    uuid_type = postgresql.UUID(as_uuid=True)

    op.create_table(
        "abstract",
        _id(),
        sa.Column("publication_id", uuid_type, nullable=False),
        sa.Column("language", sa.String(16), nullable=False, server_default="und"),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("source_record_id", uuid_type),
        *_timestamps(),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_record_id"], ["patent.source_record.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("publication_id", "language", name="uq_patent_abstract_publication_language"),
        schema="patent",
    )
    op.create_index("ix_patent_abstract_publication_id", "abstract", ["publication_id"], schema="patent")

    op.create_table(
        "description",
        _id(),
        sa.Column("publication_id", uuid_type, nullable=False),
        sa.Column("language", sa.String(16), nullable=False, server_default="und"),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("source_record_id", uuid_type),
        *_timestamps(),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_record_id"], ["patent.source_record.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("publication_id", "language", name="uq_patent_description_publication_language"),
        schema="patent",
    )
    op.create_index("ix_patent_description_publication_id", "description", ["publication_id"], schema="patent")

    op.create_table(
        "applicant",
        _id(),
        sa.Column("canonical_name", sa.String(512), nullable=False),
        sa.Column("country", sa.String(2)),
        sa.Column("external_entity_key", sa.String(256), unique=True),
        *_timestamps(),
        schema="patent",
    )
    op.create_index("ix_patent_applicant_canonical_name", "applicant", ["canonical_name"], schema="patent")

    op.create_table(
        "inventor",
        _id(),
        sa.Column("canonical_name", sa.String(512), nullable=False),
        sa.Column("country", sa.String(2)),
        sa.Column("external_entity_key", sa.String(256), unique=True),
        *_timestamps(),
        schema="patent",
    )
    op.create_index("ix_patent_inventor_canonical_name", "inventor", ["canonical_name"], schema="patent")

    op.create_table(
        "application_applicant",
        _id(),
        sa.Column("application_id", uuid_type, nullable=False),
        sa.Column("applicant_id", uuid_type, nullable=False),
        sa.Column("role", sa.String(32), nullable=False, server_default="APPLICANT"),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="1"),
        *_timestamps(),
        sa.ForeignKeyConstraint(["application_id"], ["patent.application.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["applicant_id"], ["patent.applicant.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("application_id", "applicant_id", "role", name="uq_patent_application_applicant_role"),
        schema="patent",
    )
    op.create_index(
        "ix_patent_application_applicant_applicant_id",
        "application_applicant",
        ["applicant_id"],
        schema="patent",
    )

    op.create_table(
        "application_inventor",
        _id(),
        sa.Column("application_id", uuid_type, nullable=False),
        sa.Column("inventor_id", uuid_type, nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="1"),
        *_timestamps(),
        sa.ForeignKeyConstraint(["application_id"], ["patent.application.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["inventor_id"], ["patent.inventor.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("application_id", "inventor_id", name="uq_patent_application_inventor"),
        schema="patent",
    )
    op.create_index(
        "ix_patent_application_inventor_inventor_id",
        "application_inventor",
        ["inventor_id"],
        schema="patent",
    )

    op.create_table(
        "classification",
        _id(),
        sa.Column("publication_id", uuid_type, nullable=False),
        sa.Column("scheme", sa.String(16), nullable=False),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("raw_code", sa.String(128)),
        sa.Column("source_record_id", uuid_type),
        *_timestamps(),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_record_id"], ["patent.source_record.id"], ondelete="SET NULL"),
        sa.UniqueConstraint(
            "publication_id", "scheme", "code", name="uq_patent_classification_publication_code"
        ),
        schema="patent",
    )
    op.create_index(
        "ix_patent_classification_publication_id", "classification", ["publication_id"], schema="patent"
    )
    op.create_index(
        "ix_patent_classification_code", "classification", ["scheme", "code"], schema="patent"
    )

    op.create_table(
        "priority",
        _id(),
        sa.Column("application_id", uuid_type, nullable=False),
        sa.Column("priority_number", sa.String(128), nullable=False),
        sa.Column("country", sa.String(2)),
        sa.Column("priority_date", sa.Date()),
        sa.Column("source_record_id", uuid_type),
        *_timestamps(),
        sa.ForeignKeyConstraint(["application_id"], ["patent.application.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_record_id"], ["patent.source_record.id"], ondelete="SET NULL"),
        sa.UniqueConstraint(
            "application_id", "priority_number", name="uq_patent_priority_application_number"
        ),
        schema="patent",
    )
    op.create_index("ix_patent_priority_application_id", "priority", ["application_id"], schema="patent")

    op.create_table(
        "citation",
        _id(),
        sa.Column("citing_publication_id", uuid_type, nullable=False),
        sa.Column("cited_publication_id", uuid_type),
        sa.Column("cited_publication_number", sa.String(128)),
        sa.Column("citation_type", sa.String(32), nullable=False, server_default="BACKWARD"),
        sa.Column("source_record_id", uuid_type),
        *_timestamps(),
        sa.ForeignKeyConstraint(["citing_publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cited_publication_id"], ["patent.publication.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_record_id"], ["patent.source_record.id"], ondelete="SET NULL"),
        sa.UniqueConstraint(
            "citing_publication_id",
            "cited_publication_id",
            "cited_publication_number",
            name="uq_patent_citation_edge",
        ),
        schema="patent",
    )
    op.create_index(
        "ix_patent_citation_citing_publication_id",
        "citation",
        ["citing_publication_id"],
        schema="patent",
    )
    op.create_index(
        "ix_patent_citation_cited_publication_id",
        "citation",
        ["cited_publication_id"],
        schema="patent",
    )

    op.create_table(
        "legal_event",
        _id(),
        sa.Column("publication_id", uuid_type, nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("event_code", sa.String(64), nullable=False),
        sa.Column("event_description", sa.Text(), nullable=False),
        sa.Column("legal_status", sa.String(64)),
        sa.Column("source_record_id", uuid_type),
        *_timestamps(),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_record_id"], ["patent.source_record.id"], ondelete="SET NULL"),
        sa.UniqueConstraint(
            "publication_id",
            "event_date",
            "event_code",
            "source_record_id",
            name="uq_patent_legal_event_identity",
        ),
        schema="patent",
    )
    op.create_index(
        "ix_patent_legal_event_publication_date",
        "legal_event",
        ["publication_id", "event_date"],
        schema="patent",
    )

    op.create_table(
        "family_member",
        _id(),
        sa.Column("family_id", sa.String(128), nullable=False),
        sa.Column("publication_id", uuid_type, nullable=False),
        sa.Column("country", sa.String(2), nullable=False),
        sa.Column("member_role", sa.String(32)),
        *_timestamps(),
        sa.ForeignKeyConstraint(["family_id"], ["patent.family.family_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("family_id", "publication_id", name="uq_patent_family_member_publication"),
        schema="patent",
    )
    op.create_index("ix_patent_family_member_family_id", "family_member", ["family_id"], schema="patent")

    op.create_table(
        "field_provenance",
        _id(),
        sa.Column("entity_type", sa.String(64), nullable=False),
        sa.Column("entity_id", uuid_type, nullable=False),
        sa.Column("field_name", sa.String(128), nullable=False),
        sa.Column("canonical_value", sa.Text()),
        sa.Column("source_record_id", uuid_type),
        sa.Column("verified_at", sa.DateTime(timezone=True)),
        sa.Column("confidence", sa.String(32)),
        sa.Column("conflict_status", sa.String(32), nullable=False, server_default="NONE"),
        *_timestamps(),
        sa.ForeignKeyConstraint(["source_record_id"], ["patent.source_record.id"], ondelete="SET NULL"),
        schema="patent",
    )
    op.create_index(
        "ix_patent_field_provenance_entity",
        "field_provenance",
        ["entity_type", "entity_id"],
        schema="patent",
    )

    op.create_table(
        "user",
        _id(),
        sa.Column("username", sa.String(128), nullable=False),
        sa.Column("email", sa.String(256)),
        sa.Column("password_hash", sa.String(512), nullable=False),
        sa.Column("display_name", sa.String(256), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        *_timestamps(),
        sa.UniqueConstraint("username", name="uq_system_user_username"),
        sa.UniqueConstraint("email", name="uq_system_user_email"),
        schema="system",
    )
    op.create_index("ix_system_user_email", "user", ["email"], schema="system")

    op.create_table(
        "role",
        _id(),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("description", sa.Text()),
        *_timestamps(),
        sa.UniqueConstraint("code", name="uq_system_role_code"),
        sa.UniqueConstraint("name", name="uq_system_role_name"),
        schema="system",
    )
    op.create_table(
        "permission",
        _id(),
        sa.Column("code", sa.String(128), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("description", sa.Text()),
        *_timestamps(),
        sa.UniqueConstraint("code", name="uq_system_permission_code"),
        schema="system",
    )
    op.create_table(
        "user_role",
        sa.Column("user_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("role_id", uuid_type, primary_key=True, nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["system.user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["system.role.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("user_id", "role_id", name="uq_system_user_role"),
        schema="system",
    )
    op.create_table(
        "role_permission",
        sa.Column("role_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("permission_id", uuid_type, primary_key=True, nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["system.role.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["permission_id"], ["system.permission.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("role_id", "permission_id", name="uq_system_role_permission"),
        schema="system",
    )
    op.create_table(
        "job",
        _id(),
        sa.Column("job_type", sa.String(128), nullable=False),
        sa.Column("entity_type", sa.String(64)),
        sa.Column("entity_id", sa.String(128)),
        sa.Column("source_code", sa.String(64)),
        sa.Column("status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("attempt", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("trace_id", uuid_type, nullable=False),
        sa.Column("error_code", sa.String(64)),
        sa.Column("error_message", sa.Text()),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        *_timestamps(),
        schema="system",
    )
    op.create_index("ix_system_job_status", "job", ["status"], schema="system")
    op.create_index("ix_system_job_entity", "job", ["entity_type", "entity_id"], schema="system")
    op.create_table(
        "job_log",
        _id(),
        sa.Column("job_id", uuid_type, nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("attempt", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["system.job.id"], ondelete="CASCADE"),
        schema="system",
    )
    op.create_index("ix_system_job_log_job_id", "job_log", ["job_id"], schema="system")

    op.create_table(
        "organization",
        _id(),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("code", sa.String(64)),
        sa.UniqueConstraint("name", name="uq_company_organization_name"),
        sa.UniqueConstraint("code", name="uq_company_organization_code"),
        schema="company",
    )
    op.create_table(
        "department",
        _id(),
        sa.Column("organization_id", uuid_type, nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("code", sa.String(64)),
        sa.ForeignKeyConstraint(["organization_id"], ["company.organization.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("organization_id", "name", name="uq_company_department_name"),
        schema="company",
    )
    op.create_index(
        "ix_company_department_organization_id", "department", ["organization_id"], schema="company"
    )
    op.create_table(
        "project",
        _id(),
        sa.Column("organization_id", uuid_type, nullable=False),
        sa.Column("department_id", uuid_type),
        sa.Column("owner_id", uuid_type),
        sa.Column("code", sa.String(64), nullable=False),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("status", sa.String(32), nullable=False, server_default="ACTIVE"),
        sa.Column("start_date", sa.DateTime(timezone=True)),
        sa.Column("end_date", sa.DateTime(timezone=True)),
        sa.Column("classification", sa.String(64)),
        sa.ForeignKeyConstraint(["organization_id"], ["company.organization.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["department_id"], ["company.department.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["owner_id"], ["system.user.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("code", name="uq_company_project_code"),
        schema="company",
    )
    op.create_index("ix_company_project_department_id", "project", ["department_id"], schema="company")
    op.create_index("ix_company_project_status", "project", ["status"], schema="company")
    op.create_table(
        "technology",
        _id(),
        sa.Column("name", sa.String(256), nullable=False),
        sa.Column("domain", sa.String(128)),
        sa.Column("description", sa.Text()),
        sa.Column("lifecycle_stage", sa.String(64)),
        sa.Column("keywords", sa.Text()),
        sa.UniqueConstraint("name", name="uq_company_technology_name"),
        schema="company",
    )
    op.create_index("ix_company_technology_domain", "technology", ["domain"], schema="company")
    op.create_table(
        "project_technology",
        sa.Column("project_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("technology_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("relation_type", sa.String(32), nullable=False, server_default="CORE"),
        sa.Column("relevance_note", sa.Text()),
        sa.ForeignKeyConstraint(["project_id"], ["company.project.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["technology_id"], ["company.technology.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("project_id", "technology_id", name="uq_company_project_technology"),
        schema="company",
    )
    op.create_table(
        "project_patent",
        sa.Column("project_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("publication_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("relation_type", sa.String(32), nullable=False, server_default="RELATED"),
        sa.Column("relevance_score", sa.Integer()),
        sa.Column("relation_reason", sa.Text()),
        sa.ForeignKeyConstraint(["project_id"], ["company.project.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("project_id", "publication_id", name="uq_company_project_patent"),
        schema="company",
    )
    op.create_index(
        "ix_company_project_patent_patent_id", "project_patent", ["publication_id"], schema="company"
    )
    op.create_table(
        "technology_patent",
        sa.Column("technology_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("publication_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("relation_type", sa.String(32), nullable=False, server_default="RELATED"),
        sa.Column("relation_reason", sa.Text()),
        sa.ForeignKeyConstraint(["technology_id"], ["company.technology.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("technology_id", "publication_id", name="uq_company_technology_patent"),
        schema="company",
    )
    op.create_index(
        "ix_company_technology_patent_patent_id",
        "technology_patent",
        ["publication_id"],
        schema="company",
    )

    op.create_table(
        "document",
        _id(),
        sa.Column("project_id", uuid_type),
        sa.Column("uploaded_by", uuid_type, nullable=False),
        sa.Column("name", sa.String(512), nullable=False),
        sa.Column("file_type", sa.String(32), nullable=False),
        sa.Column("storage_location", sa.String(1024), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="ACTIVE"),
        sa.Column("confidentiality", sa.String(32), nullable=False, server_default="INTERNAL"),
        sa.Column("current_version_no", sa.Integer()),
        *_timestamps(),
        sa.ForeignKeyConstraint(["project_id"], ["company.project.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["system.user.id"], ondelete="RESTRICT"),
        schema="document",
    )
    op.create_index("ix_document_project_id", "document", ["project_id"], schema="document")
    op.create_index("ix_document_uploaded_by", "document", ["uploaded_by"], schema="document")
    op.create_table(
        "document_version",
        _id(),
        sa.Column("document_id", uuid_type, nullable=False),
        sa.Column("version_no", sa.Integer(), nullable=False),
        sa.Column("file_type", sa.String(32), nullable=False),
        sa.Column("storage_location", sa.String(1024), nullable=False),
        sa.Column("checksum", sa.String(128)),
        sa.Column("file_size_bytes", sa.Integer()),
        sa.Column("uploaded_by", uuid_type, nullable=False),
        sa.Column("parse_status", sa.String(32), nullable=False, server_default="PENDING"),
        sa.Column("parse_error", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["document_id"], ["document.document.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["system.user.id"], ondelete="RESTRICT"),
        sa.UniqueConstraint("document_id", "version_no", name="uq_document_version_number"),
        sa.UniqueConstraint("checksum", name="uq_document_version_checksum"),
        schema="document",
    )
    op.create_index(
        "ix_document_version_document_id", "document_version", ["document_id"], schema="document"
    )
    op.create_table(
        "parsed_content",
        _id(),
        sa.Column("document_version_id", uuid_type, nullable=False),
        sa.Column("content_type", sa.String(32), nullable=False, server_default="TEXT"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("parser_name", sa.String(128)),
        sa.Column("parser_version", sa.String(64)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["document_version_id"], ["document.document_version.id"], ondelete="CASCADE"
        ),
        sa.UniqueConstraint(
            "document_version_id", "content_type", name="uq_document_parsed_content_type"
        ),
        schema="document",
    )
    op.create_index(
        "ix_document_parsed_content_version_id",
        "parsed_content",
        ["document_version_id"],
        schema="document",
    )
    op.create_table(
        "project_document",
        sa.Column("project_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("document_id", uuid_type, primary_key=True, nullable=False),
        sa.Column("relation_type", sa.String(32), nullable=False, server_default="REFERENCE"),
        sa.ForeignKeyConstraint(["project_id"], ["company.project.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["document_id"], ["document.document.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("project_id", "document_id", name="uq_company_project_document"),
        schema="company",
    )


def downgrade() -> None:
    op.drop_table("project_document", schema="company")
    op.drop_index("ix_document_parsed_content_version_id", table_name="parsed_content", schema="document")
    op.drop_table("parsed_content", schema="document")
    op.drop_index("ix_document_version_document_id", table_name="document_version", schema="document")
    op.drop_table("document_version", schema="document")
    op.drop_index("ix_document_uploaded_by", table_name="document", schema="document")
    op.drop_index("ix_document_project_id", table_name="document", schema="document")
    op.drop_table("document", schema="document")
    op.drop_index("ix_company_technology_patent_patent_id", table_name="technology_patent", schema="company")
    op.drop_table("technology_patent", schema="company")
    op.drop_index("ix_company_project_patent_patent_id", table_name="project_patent", schema="company")
    op.drop_table("project_patent", schema="company")
    op.drop_table("project_technology", schema="company")
    op.drop_index("ix_company_technology_domain", table_name="technology", schema="company")
    op.drop_table("technology", schema="company")
    op.drop_index("ix_company_project_status", table_name="project", schema="company")
    op.drop_index("ix_company_project_department_id", table_name="project", schema="company")
    op.drop_table("project", schema="company")
    op.drop_index("ix_company_department_organization_id", table_name="department", schema="company")
    op.drop_table("department", schema="company")
    op.drop_table("organization", schema="company")
    op.drop_index("ix_system_job_log_job_id", table_name="job_log", schema="system")
    op.drop_table("job_log", schema="system")
    op.drop_index("ix_system_job_entity", table_name="job", schema="system")
    op.drop_index("ix_system_job_status", table_name="job", schema="system")
    op.drop_table("job", schema="system")
    op.drop_table("role_permission", schema="system")
    op.drop_table("user_role", schema="system")
    op.drop_table("permission", schema="system")
    op.drop_table("role", schema="system")
    op.drop_index("ix_system_user_email", table_name="user", schema="system")
    op.drop_table("user", schema="system")
    op.drop_index("ix_patent_field_provenance_entity", table_name="field_provenance", schema="patent")
    op.drop_table("field_provenance", schema="patent")
    op.drop_index("ix_patent_family_member_family_id", table_name="family_member", schema="patent")
    op.drop_table("family_member", schema="patent")
    op.drop_index("ix_patent_legal_event_publication_date", table_name="legal_event", schema="patent")
    op.drop_table("legal_event", schema="patent")
    op.drop_index("ix_patent_citation_cited_publication_id", table_name="citation", schema="patent")
    op.drop_index("ix_patent_citation_citing_publication_id", table_name="citation", schema="patent")
    op.drop_table("citation", schema="patent")
    op.drop_index("ix_patent_priority_application_id", table_name="priority", schema="patent")
    op.drop_table("priority", schema="patent")
    op.drop_index("ix_patent_classification_code", table_name="classification", schema="patent")
    op.drop_index("ix_patent_classification_publication_id", table_name="classification", schema="patent")
    op.drop_table("classification", schema="patent")
    op.drop_index("ix_patent_application_inventor_inventor_id", table_name="application_inventor", schema="patent")
    op.drop_table("application_inventor", schema="patent")
    op.drop_index("ix_patent_application_applicant_applicant_id", table_name="application_applicant", schema="patent")
    op.drop_table("application_applicant", schema="patent")
    op.drop_index("ix_patent_inventor_canonical_name", table_name="inventor", schema="patent")
    op.drop_table("inventor", schema="patent")
    op.drop_index("ix_patent_applicant_canonical_name", table_name="applicant", schema="patent")
    op.drop_table("applicant", schema="patent")
    op.drop_index("ix_patent_description_publication_id", table_name="description", schema="patent")
    op.drop_table("description", schema="patent")
    op.drop_index("ix_patent_abstract_publication_id", table_name="abstract", schema="patent")
    op.drop_table("abstract", schema="patent")
    for schema in ("document", "company", "system"):
        op.execute(f"DROP SCHEMA IF EXISTS {schema}")
