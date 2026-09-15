from backend.app.db.base import Base
from backend.app import models  # noqa: F401


EXPECTED_TABLES = {
    "patent.family",
    "patent.application",
    "patent.publication",
    "patent.abstract",
    "patent.claim",
    "patent.description",
    "patent.applicant",
    "patent.inventor",
    "patent.application_applicant",
    "patent.application_inventor",
    "patent.classification",
    "patent.priority",
    "patent.citation",
    "patent.legal_event",
    "patent.family_member",
    "patent.source_record",
    "patent.field_provenance",
    "company.organization",
    "company.department",
    "company.project",
    "company.technology",
    "company.project_technology",
    "company.project_patent",
    "company.technology_patent",
    "company.project_document",
    "document.document",
    "document.document_version",
    "document.parsed_content",
    "system.user",
    "system.role",
    "system.permission",
    "system.user_role",
    "system.role_permission",
    "system.job",
    "system.job_log",
}


def test_phase2_metadata_has_all_migration_tables() -> None:
    actual = {f"{table.schema}.{table.name}" for table in Base.metadata.tables.values()}
    assert EXPECTED_TABLES <= actual
