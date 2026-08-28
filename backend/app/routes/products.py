import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.product import Product, ProductSection
from app.models.product_category import ProductCategory
from app.models.user import User
from app.schemas.product import (
    ProductDetailOut,
    ProductOut,
    ProductReorderRequest,
    ProductSectionIn,
    ProductSectionOut,
    ProductSectionReorderRequest,
    UploadedImageOut,
)

router = APIRouter(prefix="/api/products", tags=["products"])

UPLOAD_DIR = Path("uploads/products")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB — kept in sync with the admin form's own check

PRODUCT_NOT_FOUND = "Продукт не найден — возможно, его уже удалили"
SECTION_NOT_FOUND = "Секция не найдена — возможно, её уже удалили"


def _save_image(image: UploadFile) -> str:
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Допустимы только изображения (JPEG, PNG, WebP, GIF)",
        )

    content = image.file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Размер файла не должен превышать 10 МБ",
        )

    extension = Path(image.filename or "").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    with destination.open("wb") as buffer:
        buffer.write(content)

    return f"/uploads/products/{filename}"


def _delete_image(image_path: str | None) -> None:
    """
    Best-effort cleanup of one uploaded file.

    Only ever touches `uploads/products/`. The seeded systems point at the
    frontend's own `public/` assets (`/products/roller/white/1.webp`), which
    are checked into the repository and must survive a product being deleted
    from the admin panel — hence the prefix check rather than a bare unlink.
    """
    if not image_path or not image_path.startswith("/uploads/products/"):
        return

    file_path = UPLOAD_DIR / Path(image_path).name
    if file_path.is_file():
        file_path.unlink()


def _section_image_paths(content: dict) -> list[str]:
    """
    Every uploaded image a section payload references.

    Walks the JSON rather than switching on the section type: the five payload
    shapes keep their images in different places (`image`, `items[].image`,
    `images[]`), and a sixth type would otherwise leak its files silently.
    """
    found: list[str] = []

    def walk(node) -> None:
        if isinstance(node, dict):
            for key, value in node.items():
                if key in ("image", "images") and isinstance(value, str):
                    found.append(value)
                else:
                    walk(value)
        elif isinstance(node, list):
            for item in node:
                if isinstance(item, str):
                    found.append(item)
                else:
                    walk(item)

    walk(content)
    return found


def _parse_category_ids(raw: str) -> list[int]:
    """
    `category_ids` comes over as one comma-separated field, not as a repeated
    one.

    A repeated form field cannot express "the empty list" — omitting it is
    indistinguishable from not touching it — and neither can an empty string,
    which FastAPI replaces with the parameter's default before this function
    ever sees it. Hence one comma-separated string for the ids and, on the
    PATCH, a separate `replace_categories` flag for the intent.
    """
    ids: list[int] = []
    for chunk in raw.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        try:
            ids.append(int(chunk))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Некорректный список категорий",
            )
    return ids


def _resolve_categories(db: Session, category_ids: list[int]) -> list[ProductCategory]:
    """
    The categories a product is listed in.

    An id that no longer exists is an error rather than a silent drop: the
    admin picked it from a list, so a gap means the list they were looking at
    is stale and they need to know before saving over it.
    """
    unique_ids = list(dict.fromkeys(category_ids))
    if not unique_ids:
        return []

    categories = db.query(ProductCategory).filter(ProductCategory.id.in_(unique_ids)).all()
    if len(categories) != len(unique_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Одна из категорий не найдена — обновите страницу и попробуйте снова",
        )

    return sorted(categories, key=lambda category: category.position)


def _get_product(db: Session, product_id: int) -> Product:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=PRODUCT_NOT_FOUND)
    return product


# ── Products ───────────────────────────────────────────────────────────────


@router.get("", response_model=list[ProductOut])
async def list_products(category_id: int | None = None, db: Session = Depends(get_db)):
    """
    Public — no token required, same as product-categories.

    Sections are deliberately absent: this is what the cards on a category page
    are built from, and shipping five products' worth of page content to draw
    five thumbnails is the kind of payload nobody notices until it is 400 KB.
    """
    query = db.query(Product)
    if category_id is not None:
        query = query.filter(Product.categories.any(ProductCategory.id == category_id))

    return query.order_by(Product.position).all()


@router.post("", response_model=ProductDetailOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    title_ru: str = Form(...),
    title_tj: str = Form(...),
    title_en: str = Form(...),
    title_tr: str = Form(...),
    description_ru: str = Form(...),
    description_tj: str = Form(...),
    description_en: str = Form(...),
    description_tr: str = Form(...),
    category_ids: str = Form(""),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Step one of the client's two-step flow: the product itself — photo, title,
    description — which is what a card shows and what the page's opening screen
    is built from. Its sections are added afterwards, one request each.
    """
    categories = _resolve_categories(db, _parse_category_ids(category_ids))
    image_path = _save_image(image)
    max_position = db.query(func.max(Product.position)).scalar()

    product = Product(
        image_path=image_path,
        title_ru=title_ru,
        title_tj=title_tj,
        title_en=title_en,
        title_tr=title_tr,
        description_ru=description_ru,
        description_tj=description_tj,
        description_en=description_en,
        description_tr=description_tr,
        position=(max_position or 0) + 1,
    )
    product.categories = categories

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.post("/uploads", response_model=UploadedImageOut, status_code=status.HTTP_201_CREATED)
async def upload_section_image(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Stores one image and returns its path, for the admin panel to embed in a
    section payload. Declared above `/{product_id}` so the literal segment is
    matched first — FastAPI resolves on path *shape*, not on literal segments.
    """
    return UploadedImageOut(path=_save_image(image))


@router.post("/reorder", response_model=list[ProductOut])
async def reorder_products(
    payload: ProductReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products = {product.id: product for product in db.query(Product).all()}

    if set(payload.ordered_ids) != set(products.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список продукции устарел — обновите страницу и попробуйте снова",
        )

    for position, product_id in enumerate(payload.ordered_ids):
        products[product_id].position = position

    db.commit()
    return db.query(Product).order_by(Product.position).all()


@router.get("/{product_id}", response_model=ProductDetailOut)
async def get_product(product_id: int, db: Session = Depends(get_db)):
    """Public — the product page, sections included, in `position` order."""
    return _get_product(db, product_id)


@router.patch("/{product_id}", response_model=ProductDetailOut)
async def update_product(
    product_id: int,
    title_ru: str | None = Form(None),
    title_tj: str | None = Form(None),
    title_en: str | None = Form(None),
    title_tr: str | None = Form(None),
    description_ru: str | None = Form(None),
    description_tj: str | None = Form(None),
    description_en: str | None = Form(None),
    description_tr: str | None = Form(None),
    # Two fields, not one, because a form cannot say "no categories at all"
    # with a single one: FastAPI substitutes the parameter's default for any
    # Form value that arrives empty, so `category_ids=""` and "field omitted"
    # are indistinguishable by the time they get here. `replace_categories`
    # is what separates them — false leaves the links alone, true replaces
    # them with whatever `category_ids` holds, including nothing.
    category_ids: str = Form(""),
    replace_categories: bool = Form(False),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = _get_product(db, product_id)

    if title_ru is not None:
        product.title_ru = title_ru
    if title_tj is not None:
        product.title_tj = title_tj
    if title_en is not None:
        product.title_en = title_en
    if title_tr is not None:
        product.title_tr = title_tr
    if description_ru is not None:
        product.description_ru = description_ru
    if description_tj is not None:
        product.description_tj = description_tj
    if description_en is not None:
        product.description_en = description_en
    if description_tr is not None:
        product.description_tr = description_tr

    if replace_categories:
        product.categories = _resolve_categories(db, _parse_category_ids(category_ids))

    # A form submitted without a new file still sends an `image` part — see
    # `routes/product_categories.py` for why `size`, and not `filename`, is
    # the reliable signal that it holds nothing.
    if image is not None and image.size:
        old_image_path = product.image_path
        product.image_path = _save_image(image)
        _delete_image(old_image_path)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = _get_product(db, product_id)

    # The sections go with the product (`cascade="all, delete-orphan"`), so
    # their uploaded files have to be collected before the row disappears.
    for section in product.sections:
        for path in _section_image_paths(section.content):
            _delete_image(path)
    _delete_image(product.image_path)

    db.delete(product)
    db.commit()


# ── Sections ───────────────────────────────────────────────────────────────


@router.get("/{product_id}/sections", response_model=list[ProductSectionOut])
async def list_sections(product_id: int, db: Session = Depends(get_db)):
    return _get_product(db, product_id).sections


@router.post(
    "/{product_id}/sections",
    response_model=ProductSectionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_section(
    product_id: int,
    payload: ProductSectionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Step two of the flow: the admin picks one of the five types and fills in
    its fields. JSON rather than multipart — the payloads nest (a gallery is a
    list, a spec table is a list of pairs), and any images they reference were
    uploaded through `/uploads` beforehand.

    New sections land at the bottom of the page; `/sections/reorder` is what
    moves them.
    """
    product = _get_product(db, product_id)
    max_position = (
        db.query(func.max(ProductSection.position))
        .filter(ProductSection.product_id == product.id)
        .scalar()
    )

    section = ProductSection(
        product_id=product.id,
        type=payload.type,
        position=(max_position or 0) + 1,
        content=payload.content.model_dump(),
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section


@router.post("/{product_id}/sections/reorder", response_model=list[ProductSectionOut])
async def reorder_sections(
    product_id: int,
    payload: ProductSectionReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    The whole point of the feature: «мог менять расположения секций, и эти
    разные места секции отображались на клиентской части». The page renders
    `position` order and nothing else, so this endpoint *is* the layout.
    """
    product = _get_product(db, product_id)
    sections = {section.id: section for section in product.sections}

    if set(payload.ordered_ids) != set(sections.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список секций устарел — обновите страницу и попробуйте снова",
        )

    for position, section_id in enumerate(payload.ordered_ids):
        sections[section_id].position = position

    db.commit()
    db.refresh(product)
    return product.sections


@router.patch("/sections/{section_id}", response_model=ProductSectionOut)
async def update_section(
    section_id: int,
    payload: ProductSectionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Replaces a section's payload wholesale — there is no partial edit of a
    JSONB blob whose lists the admin can add rows to and delete rows from, and
    the form posts the section as it now stands anyway.

    Changing `type` is allowed and means exactly what it says: the block keeps
    its place on the page and becomes a different kind of block.
    """
    section = db.query(ProductSection).filter(ProductSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=SECTION_NOT_FOUND)

    new_content = payload.content.model_dump()

    # Images dropped from the payload are dropped from disk too; a re-used one
    # obviously is not.
    kept = set(_section_image_paths(new_content))
    for path in _section_image_paths(section.content):
        if path not in kept:
            _delete_image(path)

    section.type = payload.type
    section.content = new_content

    db.commit()
    db.refresh(section)
    return section


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    section = db.query(ProductSection).filter(ProductSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=SECTION_NOT_FOUND)

    for path in _section_image_paths(section.content):
        _delete_image(path)

    db.delete(section)
    db.commit()
