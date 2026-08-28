"""social links

Revision ID: e54b2971ca5a
Revises: b41f7c92d3ae
Create Date: 2026-08-29 00:00:00.000000

Replaces `contact_info`'s fixed `social_instagram_*`/`social_telegram_*`
column pair with an admin-managed, reorderable `social_links` table — an
admin can now add or drop a network without a code change. The `upgrade`
carries any existing instagram/telegram URL and enabled flag over into rows
of the new table before dropping the old columns, so a deployed database
doesn't lose what an admin already configured.

Written by hand, same reasoning as `b41f7c92d3ae`: the data move in between
the `create_table` and the column drops is clearer hand-written than
autogenerate would render it.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e54b2971ca5a'
down_revision: Union[str, None] = 'b41f7c92d3ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'social_links',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('network', sa.String(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_social_links_id'), 'social_links', ['id'], unique=False)

    contact_info = sa.table(
        'contact_info',
        sa.column('social_instagram_url', sa.String()),
        sa.column('social_instagram_enabled', sa.Boolean()),
        sa.column('social_telegram_url', sa.String()),
        sa.column('social_telegram_enabled', sa.Boolean()),
    )
    social_links = sa.table(
        'social_links',
        sa.column('network', sa.String()),
        sa.column('url', sa.String()),
        sa.column('enabled', sa.Boolean()),
        sa.column('position', sa.Integer()),
    )

    bind = op.get_bind()
    row = bind.execute(
        sa.select(
            contact_info.c.social_instagram_url,
            contact_info.c.social_instagram_enabled,
            contact_info.c.social_telegram_url,
            contact_info.c.social_telegram_enabled,
        )
    ).first()
    if row is not None:
        bind.execute(
            social_links.insert(),
            [
                {
                    "network": "instagram",
                    "url": row.social_instagram_url,
                    "enabled": row.social_instagram_enabled,
                    "position": 0,
                },
                {
                    "network": "telegram",
                    "url": row.social_telegram_url,
                    "enabled": row.social_telegram_enabled,
                    "position": 1,
                },
            ],
        )

    op.drop_column('contact_info', 'social_instagram_url')
    op.drop_column('contact_info', 'social_instagram_enabled')
    op.drop_column('contact_info', 'social_telegram_url')
    op.drop_column('contact_info', 'social_telegram_enabled')


def downgrade() -> None:
    op.add_column(
        'contact_info',
        sa.Column('social_instagram_url', sa.String(), nullable=False, server_default=''),
    )
    op.add_column(
        'contact_info',
        sa.Column('social_instagram_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.add_column(
        'contact_info',
        sa.Column('social_telegram_url', sa.String(), nullable=False, server_default=''),
    )
    op.add_column(
        'contact_info',
        sa.Column('social_telegram_enabled', sa.Boolean(), nullable=False, server_default=sa.true()),
    )
    op.alter_column('contact_info', 'social_instagram_url', server_default=None)
    op.alter_column('contact_info', 'social_instagram_enabled', server_default=None)
    op.alter_column('contact_info', 'social_telegram_url', server_default=None)
    op.alter_column('contact_info', 'social_telegram_enabled', server_default=None)

    contact_info = sa.table(
        'contact_info',
        sa.column('id', sa.Integer()),
        sa.column('social_instagram_url', sa.String()),
        sa.column('social_instagram_enabled', sa.Boolean()),
        sa.column('social_telegram_url', sa.String()),
        sa.column('social_telegram_enabled', sa.Boolean()),
    )
    social_links = sa.table(
        'social_links',
        sa.column('network', sa.String()),
        sa.column('url', sa.String()),
        sa.column('enabled', sa.Boolean()),
    )

    bind = op.get_bind()
    contact_row = bind.execute(sa.select(contact_info.c.id)).first()
    if contact_row is not None:
        for network, url_col, enabled_col in (
            ("instagram", "social_instagram_url", "social_instagram_enabled"),
            ("telegram", "social_telegram_url", "social_telegram_enabled"),
        ):
            link_row = bind.execute(
                sa.select(social_links.c.url, social_links.c.enabled).where(
                    social_links.c.network == network
                )
            ).first()
            if link_row is not None:
                bind.execute(
                    sa.update(contact_info)
                    .where(contact_info.c.id == contact_row.id)
                    .values(**{url_col: link_row.url, enabled_col: link_row.enabled})
                )

    op.drop_index(op.f('ix_social_links_id'), table_name='social_links')
    op.drop_table('social_links')
