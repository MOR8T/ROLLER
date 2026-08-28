"""
The product page's contract.

`ProductSection.content` is a JSONB blob (see the model's own note on why), and
this module is what keeps it from being a free-for-all: one Pydantic model per
section type, assembled into a discriminated union on `type`, so a malformed
payload is a 422 at the edge rather than a broken page three days later.

Localised text is a `{ru, tj, en, tr}` object everywhere, matching
`LocalizedText` in the frontend's `lib/localized.ts`. All four are required and
must be non-blank: the client asked for it, and the alternative — an empty
string reaching the page — is invisible in the admin panel and obvious to a
visitor.
"""

from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, field_validator

from app.schemas.product_category import ProductCategoryOut

SECTION_TYPES = ("finishes", "specs", "story", "gallery", "promo")


class LocalizedText(BaseModel):
    """The same string in all four site locales."""

    ru: str
    tj: str
    en: str
    tr: str

    @field_validator("ru", "tj", "en", "tr")
    @classmethod
    def _not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Заполните текст на всех четырёх языках")
        return cleaned


# ── Section payloads ───────────────────────────────────────────────────────


class FinishItem(BaseModel):
    """One lamination: the swatch fill, its name, and the render wearing it."""

    # A CSS colour as typed into the admin panel's colour picker — `#f2f2f0`.
    # Not a name: the frontend paints the swatch with this value directly.
    color: str = Field(min_length=1)
    label: LocalizedText
    # A colour with no photography still belongs in the row — the palette is a
    # fact about the system, not about the folder the client sent — so the
    # render is optional and the section falls back to its placeholder.
    image: str | None = None


class FinishesContent(BaseModel):
    items: list[FinishItem] = Field(min_length=1)
    # Explains a palette of one («ТОЛЬКО БЕЛЫЙ»); a single swatch with no
    # sentence beside it reads as missing data rather than as a decision.
    note: LocalizedText | None = None


class SpecRow(BaseModel):
    name: LocalizedText
    value: LocalizedText


class SpecsContent(BaseModel):
    title: LocalizedText
    image: str | None = None
    rows: list[SpecRow] = Field(min_length=1)


class StoryContent(BaseModel):
    title: LocalizedText
    image: str | None = None
    paragraphs: list[LocalizedText] = Field(min_length=1)


class GalleryContent(BaseModel):
    images: list[str] = Field(min_length=1)


class PromoContent(BaseModel):
    title: LocalizedText
    description: LocalizedText
    image: str | None = None
    button_label: LocalizedText
    # Internal (`/calculator`) or external (`https://…`, `tel:`) — the frontend
    # decides which link component to use from the value itself.
    button_href: str = Field(min_length=1)


# ── The section, as a discriminated union ──────────────────────────────────


class FinishesSectionIn(BaseModel):
    type: Literal["finishes"]
    content: FinishesContent


class SpecsSectionIn(BaseModel):
    type: Literal["specs"]
    content: SpecsContent


class StorySectionIn(BaseModel):
    type: Literal["story"]
    content: StoryContent


class GallerySectionIn(BaseModel):
    type: Literal["gallery"]
    content: GalleryContent


class PromoSectionIn(BaseModel):
    type: Literal["promo"]
    content: PromoContent


ProductSectionIn = Annotated[
    Union[
        FinishesSectionIn,
        SpecsSectionIn,
        StorySectionIn,
        GallerySectionIn,
        PromoSectionIn,
    ],
    Field(discriminator="type"),
]


class ProductSectionOut(BaseModel):
    id: int
    type: str
    position: int
    # Read back as the raw JSON rather than re-validated into the union: a
    # section written before a payload model gained a field must still be
    # readable, and the write path is where the shape is enforced.
    content: dict

    class Config:
        from_attributes = True


class ProductSectionReorderRequest(BaseModel):
    """Ordered list of one product's section ids, top of the page first."""

    ordered_ids: list[int]


# ── The product ────────────────────────────────────────────────────────────


class ProductOut(BaseModel):
    id: int
    image_path: str | None
    title_ru: str
    title_tj: str
    title_en: str
    title_tr: str
    description_ru: str
    description_tj: str
    description_en: str
    description_tr: str
    position: int
    categories: list[ProductCategoryOut]

    class Config:
        from_attributes = True


class ProductDetailOut(ProductOut):
    """One product with its page — the only response that carries sections."""

    sections: list[ProductSectionOut]


class ProductReorderRequest(BaseModel):
    """Ordered list of every product's id, front to back."""

    ordered_ids: list[int]


class UploadedImageOut(BaseModel):
    """
    Where an image landed.

    Section images are uploaded one at a time and *then* referenced by path
    inside a section's JSON payload — a gallery holds an unknown number of
    them, and a single multipart form that has to carry both the files and the
    structure around them is the version that gets fragile.
    """

    path: str
