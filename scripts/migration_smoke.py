"""Run a repeatable PostgreSQL migration and query smoke test."""
import os
import subprocess
import sys
from pathlib import Path

from sqlalchemy import create_engine, inspect, text


ROOT = Path(__file__).resolve().parents[1]
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


def run_migration() -> None:
    env = os.environ.copy()
    env.setdefault("PYTHONPATH", str(ROOT))
    subprocess.run(
        [
            sys.executable,
            "-m",
            "alembic",
            "-c",
            str(ROOT / "migrations" / "alembic.ini"),
            "upgrade",
            "head",
        ],
        cwd=ROOT,
        env=env,
        check=True,
    )


def main() -> None:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise SystemExit("DATABASE_URL must point to a disposable PostgreSQL database")
    run_migration()
    run_migration()
    engine = create_engine(database_url, pool_pre_ping=True)
    with engine.connect() as connection:
        assert connection.scalar(text("SELECT 1")) == 1
        table_names = {
            f"{schema}.{table}"
            for schema in ("patent", "company", "document", "system")
            for table in inspect(connection).get_table_names(schema=schema)
        }
        missing = EXPECTED_TABLES - table_names
        if missing:
            raise AssertionError(f"missing tables: {sorted(missing)}")
        assert connection.scalar(text("SELECT COUNT(*) FROM patent.family")) >= 0
    print(f"migration smoke passed: {len(table_names)} tables, SQLAlchemy query passed")


if __name__ == "__main__":
    main()
