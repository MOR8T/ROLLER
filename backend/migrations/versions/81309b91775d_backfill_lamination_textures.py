"""backfill lamination textures

Revision ID: 81309b91775d
Revises: a680292b3f27
Create Date: 2026-08-29 00:00:00.000000

`calculator_settings.lamination_colors` gained a `texture` field after the
row was already seeded, and `seed_calculator_settings` skips a table that has
a row — so every database seeded before that change carries a palette with no
photographs, and the calculator falls back to flat hex fills.

This fills in the five shipped colours' textures, and only where the key is
absent: a colour an admin has since pointed at their own upload must not be
overwritten, and neither must one they deliberately cleared (which stores an
explicit null rather than leaving the key out).
"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '81309b91775d'
down_revision: Union[str, None] = 'a680292b3f27'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SHIPPED = ("white", "anthracite", "nut", "golden-oak", "dark-oak")


def upgrade() -> None:
    bind = op.get_bind()
    row = bind.execute(
        sa.text("SELECT id, lamination_colors FROM calculator_settings LIMIT 1")
    ).first()
    if row is None:
        return

    colours = row.lamination_colors or []
    changed = False
    for colour in colours:
        if "texture" in colour:
            continue
        if colour.get("key") in SHIPPED:
            colour["texture"] = f"/cal/textures/{colour['key']}.png"
        else:
            colour["texture"] = None
        changed = True

    if changed:
        bind.execute(
            sa.text(
                "UPDATE calculator_settings SET lamination_colors = CAST(:v AS jsonb) WHERE id = :id"
            ),
            {"v": json.dumps(colours), "id": row.id},
        )


def downgrade() -> None:
    # Nothing to undo: the field is additive, and dropping it again would
    # discard whatever an admin has uploaded since.
    pass
