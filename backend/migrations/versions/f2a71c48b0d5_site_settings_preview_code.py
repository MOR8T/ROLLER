"""site settings preview code

Revision ID: f2a71c48b0d5
Revises: c1a4f0b93d72
Create Date: 2026-09-04 00:00:00.000000

Adds `site_settings.preview_code` — the code that lets someone through the
«Сайт в разработке» placeholder and see the real storefront.

Nullable with no server default: NULL is the meaningful "no code configured"
state (the placeholder's logo plate stays inert), and it is the state every
existing row should wake up in, so an upgrade can never accidentally open a
closed site.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'f2a71c48b0d5'
down_revision: Union[str, None] = 'c1a4f0b93d72'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('site_settings', sa.Column('preview_code', sa.String(length=64), nullable=True))


def downgrade() -> None:
    op.drop_column('site_settings', 'preview_code')
