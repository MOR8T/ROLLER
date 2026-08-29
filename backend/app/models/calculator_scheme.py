from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class CalculatorScheme(Base):
    """
    One construction the calculator can offer — as *declared geometry*, not as
    a drawing.

    ── Why not the drawing ───────────────────────────────────────────────────

    The 55 schemes the site shipped with are SVGs in `frontend/public/cal/`,
    parsed once into absolute pane boxes. That shape has two costs the client
    now wants gone: the size sliders cannot touch the picture (stretching a
    drawing to 3000x400 draws stiles half a metre thick), and nobody but the
    parser can author a scheme — and that parser no longer exists in the repo.

    `geometry` instead holds the *structure*: a recursive split tree where
    `v` divides a cell by mullions into columns and `h` by transoms into rows,
    and a leaf is one pane with its opening type and hinge. The renderer
    computes millimetres from it, so the profile stays a constant width at
    every size and only the glass stretches. `frontend/lib/scheme-geometry.ts`
    is the contract this column has to satisfy, and
    `scripts/convert-calculator-schemes.py` is what produced the 55 shipped
    schemes in this shape.

    A grid would not do: win_6 is a transom across the full width with the
    space under it split in two, and win_9 is a full-height casement beside a
    stacked pair. Both are guillotine cuts, in different orders.

    ── enabled / position ────────────────────────────────────────────────────

    `enabled` is what lets an admin retire a scheme without deleting it —
    a disabled row never reaches the public endpoint but keeps its geometry,
    so turning it back on is one click rather than re-authoring. `position`
    orders the picker.

    `key` is stable and unique: the shipped rows carry their original
    `win_8`/`door_3` ids, which is what the request summary's «W-8» code is
    built from and what the sales desk looks a scheme up by.
    """

    __tablename__ = "calculator_schemes"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False, unique=True, index=True)

    # "window" | "door". A plain String, not a DB enum — same reasoning as
    # `ProductSection.type`: a third construction should be a code change, not
    # a migration with an ALTER TYPE in it.
    kind = Column(String, nullable=False)

    # How many sashes wide the scheme reads. Denormalised from `geometry` on
    # purpose: it is what the picker groups by, and recomputing it per request
    # to sort a list is work the write path can do once.
    columns = Column(Integer, nullable=False, default=1)

    # A segmental arched head, as a rise relative to the width; null for a
    # square head. Relative because an arch is a proportion of the opening —
    # a fixed millimetre rise would flatten on a wide run.
    arch = Column(Float, nullable=True)

    geometry = Column(JSONB, nullable=False)

    # The size the variant opens at, in millimetres.
    #
    # Per-template rather than one number for all windows, because the shapes
    # genuinely differ: a single casement wants 530x1400 and a five-sash run
    # 1900x1400, and opening both at the same 1400x1400 means the visitor
    # corrects two sliders every time they try a variant. The shipped values
    # come from each drawing's own proportions
    # (`scripts/convert-calculator-schemes.py`); an admin can override them.
    #
    # Not validated against `sizeLimits` here — those live in
    # `calculator_settings` and the frontend clamps on the way in, so a limit
    # tightened later cannot strand a scheme with an unreachable default.
    default_width_mm = Column(Integer, nullable=False, default=1400)
    default_height_mm = Column(Integer, nullable=False, default=1400)

    enabled = Column(Boolean, nullable=False, default=True)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<CalculatorScheme(id={self.id}, key='{self.key}', kind='{self.kind}')>"
