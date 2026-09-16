"""Backfill the patent read permission for existing roles.

Revision ID: 0005_patent_read_permission
Revises: 0004_project_patent_rel
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0005_patent_read_permission"
down_revision: Union[str, Sequence[str], None] = "0004_project_patent_rel"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


PERMISSION_ID = "d253e2a6-a890-51ee-a568-9bec7924a48f"


def upgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            INSERT INTO system.permission (id, code, name)
            VALUES (:id, 'patent.read', '查看专利')
            ON CONFLICT (code) DO NOTHING
            """
        ),
        {"id": PERMISSION_ID},
    )
    connection.execute(
        sa.text(
            """
            INSERT INTO system.role_permission (role_id, permission_id)
            SELECT role.id, permission.id
            FROM system.role AS role
            CROSS JOIN system.permission AS permission
            WHERE permission.code = 'patent.read'
            ON CONFLICT (role_id, permission_id) DO NOTHING
            """
        )
    )


def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text(
            """
            DELETE FROM system.role_permission
            WHERE permission_id = (SELECT id FROM system.permission WHERE code = 'patent.read')
            """
        )
    )
    connection.execute(sa.text("DELETE FROM system.permission WHERE code = 'patent.read'"))
