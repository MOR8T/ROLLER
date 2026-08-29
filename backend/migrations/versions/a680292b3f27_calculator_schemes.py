"""calculator schemes

Revision ID: a680292b3f27
Revises: a262db276827
Create Date: 2026-08-29 00:00:00.000000

The 55 constructions the calculator offers, as *declared geometry* rather
than as parsed drawings — see `app/models/calculator_scheme.py` for why the
drawings could not stay the source. Seeded by
`app.startup.seed_calculator_schemes` from `app/seeds/calculator-schemes.json`,
which `scripts/convert-calculator-schemes.py` generates.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = 'a680292b3f27'
down_revision: Union[str, None] = 'a262db276827'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'calculator_schemes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('kind', sa.String(), nullable=False),
        sa.Column('columns', sa.Integer(), nullable=False),
        sa.Column('arch', sa.Float(), nullable=True),
        sa.Column('geometry', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_calculator_schemes_id'), 'calculator_schemes', ['id'], unique=False)
    op.create_index(op.f('ix_calculator_schemes_key'), 'calculator_schemes', ['key'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_calculator_schemes_key'), table_name='calculator_schemes')
    op.drop_index(op.f('ix_calculator_schemes_id'), table_name='calculator_schemes')
    op.drop_table('calculator_schemes')
