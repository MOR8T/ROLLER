import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.product_category import ProductCategory
from app.models.user import User
from app.schemas.product_category import ProductCategoryOut, ProductCategoryReorderRequest

router = APIRouter(prefix="/api/product-categories", tags=["product-categories"])

UPLOAD_DIR = Path("uploads/product-categories")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB — kept in sync with the admin form's own check


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

    return f"/uploads/product-categories/{filename}"


def _delete_image(image_path: str) -> None:
    """Best-effort: a missing file is not an error, just nothing to clean up."""
    file_path = UPLOAD_DIR / Path(image_path).name
    if file_path.is_file():
        file_path.unlink()


@router.get("", response_model=list[ProductCategoryOut])
async def list_product_categories(db: Session = Depends(get_db)):
    """Public — no token required, same as partners/hero-slides."""
    return db.query(ProductCategory).order_by(ProductCategory.position).all()


@router.post("", response_model=ProductCategoryOut, status_code=status.HTTP_201_CREATED)
async def create_product_category(
    name_ru: str = Form(...),
    name_tj: str = Form(...),
    name_en: str = Form(...),
    name_tr: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_path = _save_image(image)
    max_position = db.query(func.max(ProductCategory.position)).scalar()

    category = ProductCategory(
        name_ru=name_ru,
        name_tj=name_tj,
        name_en=name_en,
        name_tr=name_tr,
        image_path=image_path,
        position=(max_position or 0) + 1,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.post("/reorder", response_model=list[ProductCategoryOut])
async def reorder_product_categories(
    payload: ProductCategoryReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registered ahead of the `/{category_id}` routes below on purpose: FastAPI
    matches path *shape*, not literal segments, so a `POST /{category_id}`
    (there isn't one, but a future one would) could otherwise swallow
    `POST /reorder` with `category_id="reorder"`.
    """
    categories = {category.id: category for category in db.query(ProductCategory).all()}

    if set(payload.ordered_ids) != set(categories.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список категорий устарел — обновите страницу и попробуйте снова",
        )

    for position, category_id in enumerate(payload.ordered_ids):
        categories[category_id].position = position

    db.commit()
    return db.query(ProductCategory).order_by(ProductCategory.position).all()


@router.patch("/{category_id}", response_model=ProductCategoryOut)
async def update_product_category(
    category_id: int,
    name_ru: str | None = Form(None),
    name_tj: str | None = Form(None),
    name_en: str | None = Form(None),
    name_tr: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена — возможно, её уже удалили",
        )

    if name_ru is not None:
        category.name_ru = name_ru
    if name_tj is not None:
        category.name_tj = name_tj
    if name_en is not None:
        category.name_en = name_en
    if name_tr is not None:
        category.name_tr = name_tr
    # A form submitted without a new file still sends an `image` part. A
    # plain HTML form leaves it with an empty filename; going through a
    # Next.js server action (as the admin form does) instead turns it into a
    # zero-byte file literally named "undefined" — either way it means "keep
    # the current photo", not "replace it with nothing", so `size` is the
    # reliable signal, not `filename`.
    if image is not None and image.size:
        old_image_path = category.image_path
        category.image_path = _save_image(image)
        _delete_image(old_image_path)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена — возможно, её уже удалили",
        )

    _delete_image(category.image_path)
    db.delete(category)
    db.commit()
