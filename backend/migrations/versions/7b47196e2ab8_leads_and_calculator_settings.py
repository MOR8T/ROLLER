"""leads and calculator settings

Revision ID: 7b47196e2ab8
Revises: 8d17d010265d
Create Date: 2026-08-29 00:00:00.000000

Two independent tables, added together because both back the calculator
integration in one pass:

- `leads` — gives `lib/leads.ts`'s documented "store first, WhatsApp second"
  contract somewhere to store to. `kind` tells apart the site's one request
  form (`"full"`) from the short "Свяжитесь с нами" form (`"quick"`); columns
  the other shape doesn't use stay null.
- `calculator_settings` — a singleton (row id=1) holding the calculator's
  option lists (mechanisms, accessories, lamination colours, size limits),
  seeded by `app.startup.seed_calculator_settings` with the same values
  `data/calculator.ts` hardcodes today.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '7b47196e2ab8'
down_revision: Union[str, None] = '8d17d010265d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'leads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('scenario', sa.String(), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('product_type', sa.String(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('configuration', sa.Text(), nullable=True),
        sa.Column('interests', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('context', sa.String(), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('is_reviewed', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_leads_id'), 'leads', ['id'], unique=False)

    op.create_table(
        'calculator_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('mechanisms', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('accessories', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('lamination_colors', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('size_limits', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        op.f('ix_calculator_settings_id'), 'calculator_settings', ['id'], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_calculator_settings_id'), table_name='calculator_settings')
    op.drop_table('calculator_settings')

    op.drop_index(op.f('ix_leads_id'), table_name='leads')
    op.drop_table('leads')
