"""calculator profile series

Revision ID: 8d8def28453f
Revises: 4844e5361f34
Create Date: 2026-08-29 00:00:00.000000

Moves the calculator's «Серия профиля» list out of the frontend.

It was the last option list still hardcoded: the series themselves came from
`data/products.ts` and the glazing each one sells with from a `systemOptions`
map beside it, so adding a series meant a redeploy — and the admin panel's
calculator page silently did not govern that select.

The six shipped systems are backfilled below with the glazing ladders that
map held. Aluminium ALD-45 is doors-only, matching the catalogue, where it
appears in the `doors` category and not in `windows`.
"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '8d8def28453f'
down_revision: Union[str, None] = '4844e5361f34'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _label(text: str) -> dict:
    """Brand names read the same in all four locales."""
    return {locale: text for locale in ("ru", "tj", "en", "tr")}


SHIPPED_SERIES = [
    {
        "key": "ecoline",
        "label": _label("ЭКОЛАЙН"),
        "material": "pvc",
        "constructions": ["window", "door"],
        "glazing": ["single-chamber"],
    },
    {
        "key": "roller",
        "label": _label("ROLLER"),
        "material": "pvc",
        "constructions": ["window", "door"],
        "glazing": ["single-chamber", "double-chamber"],
    },
    {
        "key": "unopen",
        "label": _label("UNOPEN"),
        "material": "pvc",
        "constructions": ["window", "door"],
        "glazing": ["single-chamber", "double-chamber", "double-chamber-energy"],
    },
    {
        "key": "stella",
        "label": _label("STELLA"),
        "material": "pvc",
        "constructions": ["window", "door"],
        "glazing": ["double-chamber", "double-chamber-energy"],
    },
    {
        "key": "ald-45",
        "label": _label("АЛД-45"),
        "material": "aluminium",
        "constructions": ["door"],
        "glazing": ["single-glass", "single-chamber"],
    },
    {
        "key": "thermo-60",
        "label": _label("ТЕРМО 60"),
        "material": "aluminium",
        "constructions": ["window", "door"],
        "glazing": ["single-chamber", "double-chamber", "double-chamber-energy"],
    },
]


def upgrade() -> None:
    # Server default so the NOT NULL can be added against an existing row;
    # dropped again below, since the application always supplies the value.
    op.add_column(
        "calculator_settings",
        sa.Column(
            "series",
            sa.dialects.postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
            server_default="[]",
        ),
    )

    bind = op.get_bind()
    row = bind.execute(sa.text("SELECT id, series FROM calculator_settings LIMIT 1")).first()
    # Only fills an empty list: a re-run, or a row an admin has already
    # curated, must not have their work replaced by the shipped six.
    if row is not None and not row.series:
        bind.execute(
            sa.text("UPDATE calculator_settings SET series = CAST(:v AS jsonb) WHERE id = :id"),
            {"v": json.dumps(SHIPPED_SERIES), "id": row.id},
        )

    op.alter_column("calculator_settings", "series", server_default=None)


def downgrade() -> None:
    op.drop_column("calculator_settings", "series")
