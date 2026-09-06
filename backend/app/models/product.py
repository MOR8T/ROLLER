from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.database import Base

# Many-to-many, deliberately: a system is sold as a window *and* as a door, and
# the catalogue has said so since `data/products.ts` — one product, several
# categories. The category is therefore part of the address the visitor
# followed (`/products/<category_id>/<product_id>`), not a property of the
# product, which is why it lives in a link table rather than in a column here.
product_category_links = Table(
    "product_category_links",
    Base.metadata,
    Column(
        "product_id",
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "category_id",
        Integer,
        ForeignKey("product_categories.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Product(Base):
    """
    One profile system.

    Holds only what the admin fills in *first* and what a card needs: a photo,
    a title and a description, in all four locales. Everything else on the
    product page is a `ProductSection` below — that split is the client's:
    «сперва админ создаёт саму продукцию … после этого админ в самом продукте
    будет вводить его информацию».

    The same three fields also drive the page's opening screen (`hero`), which
    is why there is no separate hero section type: the hero *is* the product.

    `image_path` is nullable although the admin form requires it — ЭКОЛАЙН has
    no render at all (the client never sent that folder), and the seed has to
    be able to say so rather than invent a photograph for it.
    """

    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    image_path = Column(String, nullable=True)

    title_ru = Column(String, nullable=False)
    title_tj = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    title_tr = Column(String, nullable=False)

    description_ru = Column(Text, nullable=False)
    description_tj = Column(Text, nullable=False)
    description_en = Column(Text, nullable=False)
    description_tr = Column(Text, nullable=False)

    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    categories = relationship(
        "ProductCategory",
        secondary=product_category_links,
        lazy="selectin",
        backref="products",
    )
    sections = relationship(
        "ProductSection",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductSection.position",
        lazy="selectin",
    )

    def __repr__(self):
        return f"<Product(id={self.id}, title_ru='{self.title_ru}')>"


class ProductSection(Base):
    """
    One block on a product page, of one of four types.

    ── Why `content` is JSONB and not columns ─────────────────────────────────

    The four types agree on nothing: `specs` is a list of name/value pairs,
    `finishes` a list of colour + label + render, `story` a variable number of
    paragraphs, `gallery` a list of photographs. Columns for the union of that
    would be almost entirely NULL and would need a migration every time a type
    gains a field. The shape of each payload is enforced by the Pydantic
    models in `app/schemas/product.py` (a discriminated union on `type`), so
    "no columns" does not mean "no validation" — nothing reaches this column
    unvalidated.

    Localised text inside `content` is a `{ru, tj, en, tr}` object, matching
    `LocalizedText` in the frontend's `lib/localized.ts`: the product page
    assembles all four locales into one value and each section picks its own,
    so the API hands it exactly that shape.

    ⚠️ There used to be a fifth type, `promo` — the calculator pitch. Every
    product's payload was byte-identical (same text, same image, same
    «/calculator» link), so it was never really per-product content: it first
    became a fixed block the product page rendered unconditionally, and the
    client then dropped the block from the page entirely. It is no longer one
    of `SECTION_TYPES`, and a migration deleted the leftover `type = 'promo'`
    rows this table held from before the change.

    ── Why a type may repeat ─────────────────────────────────────────────────

    Nothing here is unique per product. Two galleries, or two spec tables, are
    legitimate layouts, and `position` — not the type — is what fixes the
    order on the page.
    """

    __tablename__ = "product_sections"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # One of `SECTION_TYPES` in `app/schemas/product.py`. A plain String, not a
    # DB enum: adding a sixth section type should be a code change, not a
    # migration with an ALTER TYPE in it.
    type = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    content = Column(JSONB, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="sections")

    def __repr__(self):
        return f"<ProductSection(id={self.id}, product_id={self.product_id}, type='{self.type}')>"
