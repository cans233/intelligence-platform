"""Create phase one patent foundation tables.

Revision ID: 0001_phase1_patent_foundation
Revises:
Create Date: 2026-09-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "0001_phase1_patent_foundation"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PATENT_STATUS_VALUES = (
    "DISCOVERED",
    "RAW_SAVED",
    "NORMALIZED",
    "VALIDATED",
    "CONFLICT",
    "PARSED",
    "ENRICHED",
    "INDEXED",
    "ACTIVE",
    "FAILED",
)


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS patent")
    uuid_type = postgresql.UUID(as_uuid=True)

    op.create_table(
        "family",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("family_id", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("family_id", name="uq_patent_family_family_id"),
        schema="patent",
    )

    op.create_table(
        "application",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("family_id", sa.String(length=128), nullable=False),
        sa.Column("application_number", sa.String(length=128), nullable=False),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("filing_date", sa.Date()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["family_id"], ["patent.family.family_id"], ondelete="RESTRICT"
        ),
        sa.UniqueConstraint("application_number", name="uq_patent_application_application_number"),
        schema="patent",
    )
    op.create_index("ix_patent_application_family_id", "application", ["family_id"], schema="patent")

    status_type = sa.Enum(*PATENT_STATUS_VALUES, name="patent_status", native_enum=False)
    op.create_table(
        "publication",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("application_id", uuid_type, nullable=False),
        sa.Column("publication_number", sa.String(length=128), nullable=False),
        sa.Column("title", sa.String(length=1000), nullable=False),
        sa.Column("abstract", sa.Text()),
        sa.Column("description", sa.Text()),
        sa.Column("publication_date", sa.Date()),
        sa.Column("legal_status", sa.String(length=64)),
        sa.Column("status", status_type, server_default="DISCOVERED", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["patent.application.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("publication_number", name="uq_patent_publication_publication_number"),
        schema="patent",
    )
    op.create_index(
        "ix_patent_publication_application_id", "publication", ["application_id"], schema="patent"
    )
    op.create_index("ix_patent_publication_status", "publication", ["status"], schema="patent")

    op.create_table(
        "claim",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("publication_id", uuid_type, nullable=False),
        sa.Column("claim_no", sa.Integer(), nullable=False),
        sa.Column("claim_type", sa.String(length=32)),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="CASCADE"),
        schema="patent",
    )
    op.create_index("ix_patent_claim_publication_id", "claim", ["publication_id"], schema="patent")

    op.create_table(
        "source_record",
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("publication_id", uuid_type),
        sa.Column("source_code", sa.String(length=32), nullable=False),
        sa.Column("source_record_id", sa.String(length=256), nullable=False),
        sa.Column("raw_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["publication_id"], ["patent.publication.id"], ondelete="SET NULL"),
        sa.UniqueConstraint(
            "source_code", "source_record_id", name="uq_patent_source_record_source_key"
        ),
        schema="patent",
    )


def downgrade() -> None:
    op.drop_table("source_record", schema="patent")
    op.drop_index("ix_patent_claim_publication_id", table_name="claim", schema="patent")
    op.drop_table("claim", schema="patent")
    op.drop_index("ix_patent_publication_status", table_name="publication", schema="patent")
    op.drop_index("ix_patent_publication_application_id", table_name="publication", schema="patent")
    op.drop_table("publication", schema="patent")
    op.drop_index("ix_patent_application_family_id", table_name="application", schema="patent")
    op.drop_table("application", schema="patent")
    op.drop_table("family", schema="patent")
    op.execute("DROP SCHEMA IF EXISTS patent")
