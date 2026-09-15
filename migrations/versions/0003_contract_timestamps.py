"""Add timestamps required by the Phase 2 integration contract.

Revision ID: 0003_contract_timestamps
Revises: 0002_phase2_core_facts
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0003_contract_timestamps"
down_revision: Union[str, Sequence[str], None] = "0002_phase2_core_facts"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    for table in ("project", "technology"):
        op.add_column(
            table,
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            schema="company",
        )
        op.add_column(
            table,
            sa.Column(
                "updated_at",
                sa.DateTime(timezone=True),
                server_default=sa.func.now(),
                nullable=False,
            ),
            schema="company",
        )


def downgrade() -> None:
    for table in ("technology", "project"):
        op.drop_column(table, "updated_at", schema="company")
        op.drop_column(table, "created_at", schema="company")
