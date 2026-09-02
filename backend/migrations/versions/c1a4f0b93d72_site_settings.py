"""site settings

Revision ID: c1a4f0b93d72
Revises: 8d8def28453f
Create Date: 2026-09-02 00:00:00.000000

Singleton table behind «Настройки сайта» → «Сайт в разработке». One row, one
boolean today; `app.startup.seed_site_settings` inserts it on the next boot,
so this revision only has to create the table — seeding a row here as well
would race that function on an already-running deploy.

`maintenance_mode` gets a `server_default` of false so the insert the seed
does (and any that predates the model default reaching a worker) cannot land
a NULL in a NOT NULL column; the default is then dropped, matching how the
rest of this project keeps defaults in the application rather than the schema.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'c1a4f0b93d72'
down_revision: Union[str, None] = '8d8def28453f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'site_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column(
            'maintenance_mode',
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_site_settings_id'), 'site_settings', ['id'], unique=False)
    op.alter_column('site_settings', 'maintenance_mode', server_default=None)


def downgrade() -> None:
    op.drop_index(op.f('ix_site_settings_id'), table_name='site_settings')
    op.drop_table('site_settings')
