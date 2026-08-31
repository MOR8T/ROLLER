"""calculator scheme default sizes

Revision ID: 4844e5361f34
Revises: 81309b91775d
Create Date: 2026-08-29 00:00:00.000000

Gives each scheme the size it opens at.

One size for every window meant a visitor trying a single casement and then a
five-sash run corrected both sliders each time — the shapes are genuinely
different and 1400x1400 suits neither. The shipped values come from each
drawing's own proportions, computed by
`scripts/convert-calculator-schemes.py`, so the backfill below carries the
same numbers a fresh seed would produce.

Rows added since (an admin's own schemes) fall back to the column default
rather than being guessed at.
"""
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4844e5361f34'
down_revision: Union[str, None] = '81309b91775d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# key -> (width, height) in millimetres, for the 55 schemes the site shipped
# with. Embedded rather than read from `app/seeds/` so this revision keeps
# meaning the same thing after the seed file changes.
SHIPPED_SIZES = {
    "win_1": (530, 1400),
    "win_2": (530, 1400),
    "win_3": (530, 1400),
    "win_4": (530, 1400),
    "win_5": (1050, 1400),
    "win_6": (1050, 1400),
    "win_7": (1050, 1400),
    "win_8": (1050, 1400),
    "win_9": (1040, 1400),
    "win_10": (1050, 1400),
    "win_11": (1050, 1400),
    "win_12": (1920, 1400),
    "win_13": (1050, 1400),
    "win_14": (1050, 1400),
    "win_15": (1050, 1400),
    "win_16": (1050, 1400),
    "win_17": (1050, 1400),
    "win_18": (1410, 1400),
    "win_19": (1190, 1400),
    "win_20": (1410, 1400),
    "win_21": (1410, 1400),
    "win_22": (1410, 1400),
    "win_23": (1410, 1400),
    "win_24": (1190, 1400),
    "win_25": (1190, 1400),
    "win_26": (1190, 1400),
    "win_27": (1190, 1400),
    "win_28": (1190, 1400),
    "win_29": (1190, 1400),
    "win_30": (1120, 1400),
    "win_31": (1190, 1400),
    "win_32": (1590, 1400),
    "win_33": (2360, 1400),
    "win_34": (1590, 1400),
    "win_35": (1070, 1400),
    "win_36": (1590, 1400),
    "win_37": (1180, 1400),
    "win_38": (1180, 1400),
    "win_39": (1850, 1400),
    "win_40": (1850, 1400),
    "win_41": (1850, 1400),
    "win_42": (1180, 1400),
    "win_43": (800, 1400),
    "win_44": (800, 1400),
    "win_45": (800, 1400),
    "win_46": (800, 1400),
    "win_47": (940, 1400),
    "door_1": (1290, 2100),
    "door_2": (1290, 2100),
    "door_3": (1290, 2100),
    "door_4": (820, 2100),
    "door_5": (750, 2100),
    "door_6": (780, 2100),
    "door_7": (770, 2100),
    "door_8": (700, 2100),
}


def upgrade() -> None:
    op.add_column(
        "calculator_schemes",
        sa.Column("default_width_mm", sa.Integer(), nullable=False, server_default="1400"),
    )
    op.add_column(
        "calculator_schemes",
        sa.Column("default_height_mm", sa.Integer(), nullable=False, server_default="1400"),
    )

    bind = op.get_bind()
    for key, (width, height) in SHIPPED_SIZES.items():
        bind.execute(
            sa.text(
                "UPDATE calculator_schemes SET default_width_mm = :w, default_height_mm = :h "
                "WHERE key = :k"
            ),
            {"w": width, "h": height, "k": key},
        )

    # The server default existed only so the ALTER could run against rows that
    # already had none; the application supplies the value from here on.
    op.alter_column("calculator_schemes", "default_width_mm", server_default=None)
    op.alter_column("calculator_schemes", "default_height_mm", server_default=None)


def downgrade() -> None:
    op.drop_column("calculator_schemes", "default_height_mm")
    op.drop_column("calculator_schemes", "default_width_mm")
