from typing import Literal

from pydantic import BaseModel, Field

ConstructionKind = str  # "window" | "door" — kept a plain str, see app/models/product.py's own note on why enums-as-strings avoid an ALTER TYPE for a set the client still moves.


class Label(BaseModel):
    """The same short string in all four site locales."""

    ru: str = Field(min_length=1)
    tj: str = Field(min_length=1)
    en: str = Field(min_length=1)
    tr: str = Field(min_length=1)


GlazingKey = Literal[
    "single-glass", "single-chamber", "double-chamber", "double-chamber-energy"
]


class Series(BaseModel):
    """One profile system, as the calculator offers it."""

    key: str = Field(min_length=1)
    label: Label
    material: Literal["pvc", "aluminium"]
    constructions: list[ConstructionKind] = Field(min_length=1)
    # Which glazing units this series sells with. A closed set rather than an
    # admin list: the four are physical products (chamber count), not a
    # taxonomy the client edits — what *is* editable is which of them a given
    # series offers, which is this field.
    glazing: list[GlazingKey] = Field(min_length=1)


class Mechanism(BaseModel):
    key: str = Field(min_length=1)
    label: Label


class Accessory(BaseModel):
    key: str = Field(min_length=1)
    label: Label
    constructions: list[ConstructionKind] = Field(min_length=1)


class LaminationColor(BaseModel):
    key: str = Field(min_length=1)
    label: Label
    # A CSS colour, `#f2f2f0`. Always required, even when a texture is
    # uploaded: it is the swatch the admin list draws, and the fallback the
    # scene paints while the texture image is still loading or missing.
    hex: str = Field(min_length=1)
    # The lamination photograph tiled across the profile in the calculator's
    # scene. Either an admin upload (`/uploads/calculator/<uuid>.png`, via
    # `POST /api/calculator-settings/texture`) or one of the five files the
    # site shipped with (`/cal/textures/<key>.png`, served by Next.js) — both
    # are same-origin paths behind the production nginx, so the scene does not
    # care which it got. Null means "no photograph": the scene falls back to
    # `hex`, which is why a colour without a texture is still a valid entry.
    texture: str | None = None


class Range(BaseModel):
    min: int
    max: int
    step: int
    default: int


class ConstructionSizeLimits(BaseModel):
    width: Range
    height: Range


class SizeLimits(BaseModel):
    window: ConstructionSizeLimits
    door: ConstructionSizeLimits


class CalculatorSettingsOut(BaseModel):
    series: list[Series]
    mechanisms: list[Mechanism]
    accessories: list[Accessory]
    lamination_colors: list[LaminationColor]
    size_limits: SizeLimits

    class Config:
        from_attributes = True


class CalculatorSettingsUpdate(BaseModel):
    series: list[Series]
    mechanisms: list[Mechanism]
    accessories: list[Accessory]
    lamination_colors: list[LaminationColor]
    size_limits: SizeLimits
