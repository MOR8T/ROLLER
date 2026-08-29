from datetime import datetime

from sqlalchemy import Column, DateTime, Integer
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class CalculatorSettings(Base):
    """
    Singleton (row id=1) holding every option list an admin maintains for the
    calculator — same shape as `ContactInfo`/`AboutContent`.

    The public calculator reads this row: the series select, the mechanism
    select, the extras checkboxes, the lamination swatches and the slider
    ranges all come from here, resolved to the visitor's locale by
    `frontend/lib/calculator-schemes.ts`. Editing it changes the site without
    a redeploy, which is the whole point.

    A `series` entry is `{key, label: {ru, tj, en, tr}, material, constructions,
    glazing}` — one profile system as the calculator offers it: which material
    it is, which constructions it can be built as, and which glazing units it
    sells with. It deliberately mirrors, rather than joins to, the catalogue's
    `products` table: the calculator's list is what the sales desk quotes from
    and moves independently of what the catalogue chooses to publish.

    Each entry in `mechanisms`/`accessories`/`lamination_colors` is
    `{key, label: {ru, tj, en, tr}}`; `accessories` entries add
    `constructions: ["window"|"door", ...]`; `lamination_colors` entries add
    `hex` and `texture`. `texture` is the lamination photograph tiled across
    the profile — either an admin upload (`/uploads/calculator/...`) or one of
    the files the site shipped with (`/cal/textures/<key>.png`); null means no
    photograph and the scene falls back to `hex`. `size_limits` is
    `{window: {width: Range, height: Range}, door: {...}}` where
    `Range = {min, max, step, default}`, matching `data/calculator.ts`'s
    `Range` type exactly.
    """

    __tablename__ = "calculator_settings"

    id = Column(Integer, primary_key=True, index=True)

    series = Column(JSONB, nullable=False)
    mechanisms = Column(JSONB, nullable=False)
    accessories = Column(JSONB, nullable=False)
    lamination_colors = Column(JSONB, nullable=False)
    size_limits = Column(JSONB, nullable=False)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<CalculatorSettings(id={self.id})>"
