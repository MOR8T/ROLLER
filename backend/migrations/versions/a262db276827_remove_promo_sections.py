"""remove promo sections

Revision ID: a262db276827
Revises: 7b47196e2ab8
Create Date: 2026-08-29 00:00:00.000000

`promo` stops being a `ProductSection` type: every product's payload was
byte-identical, so it moves to a block the product page renders
unconditionally (same treatment as the contacts block) instead of admin
content. See `app/models/product.py`'s `ProductSection` docstring and
`app/schemas/product.py`'s `SECTION_TYPES`.

This drops the now-unreachable `type = 'promo'` rows — the admin panel can no
longer create or edit that type, and the frontend no longer reads it, so a
leftover row is dead weight, not data. Not reversible: the content itself
still exists (hardcoded on the frontend), but which product had a `promo` row
at which `position` does not.
"""
from typing import Sequence, Union

from alembic import op


revision: str = 'a262db276827'
down_revision: Union[str, None] = '7b47196e2ab8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DELETE FROM product_sections WHERE type = 'promo'")


def downgrade() -> None:
    # Deleted rows are not reconstructable — see the module docstring.
    pass
