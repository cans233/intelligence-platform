"""Constrain project patent relation semantics.

Revision ID: 0004_project_patent_relation_type
Revises: 0003_contract_timestamps
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0004_project_patent_relation_type"
down_revision: Union[str, Sequence[str], None] = "0003_contract_timestamps"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "UPDATE company.project_patent "
        "SET relation_type = 'EXTERNAL' "
        "WHERE relation_type NOT IN ('COMPANY', 'EXTERNAL')"
    )
    op.alter_column(
        "project_patent",
        "relation_type",
        schema="company",
        existing_type=sa.String(32),
        nullable=False,
        server_default="EXTERNAL",
    )
    op.create_check_constraint(
        "ck_company_project_patent_relation_type",
        "project_patent",
        "relation_type IN ('COMPANY', 'EXTERNAL')",
        schema="company",
    )


def downgrade() -> None:
    op.drop_constraint(
        "ck_company_project_patent_relation_type",
        "project_patent",
        schema="company",
        type_="check",
    )
    op.alter_column(
        "project_patent",
        "relation_type",
        schema="company",
        existing_type=sa.String(32),
        nullable=False,
        server_default="RELATED",
    )
