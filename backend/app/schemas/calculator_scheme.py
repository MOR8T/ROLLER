"""
The declared-geometry contract.

`CalculatorScheme.geometry` is JSONB, and this module is what keeps it from
being a free-for-all — the same job `app/schemas/product.py` does for
`ProductSection.content`. A malformed tree is a 422 at the edge rather than a
window that renders as an empty box three days later.

The shapes mirror `frontend/lib/scheme-geometry.ts` exactly; that file is the
renderer, this one is the gate.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal, Union

from pydantic import BaseModel, Discriminator, Field, Tag, field_validator, model_validator

OPENING_TYPES = ("fixed", "casement", "tilt", "tilt-turn")
HINGES = ("left", "right", "bottom")


class SchemeLeaf(BaseModel):
    """One pane."""

    opening: Literal["fixed", "casement", "tilt", "tilt-turn"]
    hinge: Literal["left", "right", "bottom"] | None = None

    @model_validator(mode="after")
    def _hinge_matches_opening(self) -> "SchemeLeaf":
        # A fixed pane with a hinge, or a casement without one, would render
        # as something the admin did not draw: the chevron is placed from the
        # hinge, so a missing one silently picks a side.
        if self.opening == "fixed":
            if self.hinge is not None:
                raise ValueError("Глухая створка не может иметь петель")
        elif self.hinge is None:
            raise ValueError("Укажите сторону петель для открывающейся створки")
        return self


class SchemeSplit(BaseModel):
    """A cell divided into more cells."""

    # "v" = vertical mullions (columns), "h" = horizontal transoms (rows).
    split: Literal["v", "h"]
    children: list["SchemeChild"] = Field(min_length=2)


class SchemeChild(BaseModel):
    # Relative, and normalised by the renderer — so any positive number works,
    # but zero would lay out a cell of no width.
    weight: float = Field(gt=0)
    node: "SchemeNode"


def _node_kind(value: Any) -> str:
    """
    Which branch of the node union a payload is.

    A plain `Union` would try both and, on failure, report whichever branch
    lost — so a fixed pane sent with a hinge came back as «Field required»
    (the *split* branch complaining about its missing `split`) instead of the
    real reason. The admin panel shows `detail[0].msg` verbatim, so that is
    the difference between a usable error and a baffling one.

    The two shapes have no shared tag field, hence a callable discriminator
    rather than a literal one.
    """
    if isinstance(value, dict):
        return "split" if "split" in value else "leaf"
    return "split" if hasattr(value, "split") else "leaf"


SchemeNode = Annotated[
    Union[Annotated[SchemeSplit, Tag("split")], Annotated[SchemeLeaf, Tag("leaf")]],
    Discriminator(_node_kind),
]

SchemeSplit.model_rebuild()
SchemeChild.model_rebuild()


class CalculatorSchemeOut(BaseModel):
    id: int
    key: str
    kind: str
    columns: int
    arch: float | None
    geometry: SchemeNode
    default_width_mm: int
    default_height_mm: int
    enabled: bool
    position: int

    class Config:
        from_attributes = True


class CalculatorSchemeCreate(BaseModel):
    key: str = Field(min_length=1, max_length=64)
    kind: Literal["window", "door"]
    arch: float | None = Field(default=None, gt=0, le=1)
    geometry: SchemeNode
    default_width_mm: int = Field(default=1400, gt=0, le=10000)
    default_height_mm: int = Field(default=1400, gt=0, le=10000)
    enabled: bool = True

    @field_validator("key")
    @classmethod
    def _slug(cls, value: str) -> str:
        cleaned = value.strip()
        # The key travels into the request summary as «W-8» and is what the
        # sales desk looks a scheme up by, so it has to survive being written
        # down and typed back in.
        if not all(char.isalnum() or char in "-_" for char in cleaned):
            raise ValueError("Ключ может содержать только латиницу, цифры, дефис и подчёркивание")
        return cleaned


class CalculatorSchemeUpdate(BaseModel):
    kind: Literal["window", "door"] | None = None
    arch: float | None = Field(default=None, gt=0, le=1)
    geometry: SchemeNode | None = None
    default_width_mm: int | None = Field(default=None, gt=0, le=10000)
    default_height_mm: int | None = Field(default=None, gt=0, le=10000)
    enabled: bool | None = None
    # Distinguishes "leave the arch alone" from "make it square-headed":
    # `arch=None` cannot say which, because an omitted field is also None.
    clear_arch: bool = False


class CalculatorSchemeReorderRequest(BaseModel):
    """Ordered list of every scheme's id, front to back."""

    ordered_ids: list[int]
