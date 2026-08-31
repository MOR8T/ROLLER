import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.hero_slide import HeroSlide
from app.models.user import User
from app.schemas.hero_slide import HeroSlideOut, HeroSlideReorderRequest

router = APIRouter(prefix="/api/hero-slides", tags=["hero-slides"])

UPLOAD_DIR = Path("uploads/hero")
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

    return f"/uploads/hero/{filename}"


def _delete_image(image_path: str) -> None:
    """Best-effort: a missing file is not an error, just nothing to clean up."""
    file_path = UPLOAD_DIR / Path(image_path).name
    if file_path.is_file():
        file_path.unlink()


@router.get("", response_model=list[HeroSlideOut])
async def list_hero_slides(db: Session = Depends(get_db)):
    """Public — the homepage reads this without a token."""
    return db.query(HeroSlide).order_by(HeroSlide.position).all()


@router.post("", response_model=HeroSlideOut, status_code=status.HTTP_201_CREATED)
async def create_hero_slide(
    title_ru: str = Form(...),
    title_tj: str = Form(...),
    title_en: str = Form(...),
    title_tr: str = Form(...),
    product_link: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_path = _save_image(image)
    max_position = db.query(func.max(HeroSlide.position)).scalar()

    slide = HeroSlide(
        title_ru=title_ru,
        title_tj=title_tj,
        title_en=title_en,
        title_tr=title_tr,
        image_path=image_path,
        product_link=product_link,
        position=(max_position or 0) + 1,
    )
    db.add(slide)
    db.commit()
    db.refresh(slide)
    return slide


@router.post("/reorder", response_model=list[HeroSlideOut])
async def reorder_hero_slides(
    payload: HeroSlideReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registered ahead of the `/{slide_id}` routes below on purpose: FastAPI
    matches path *shape*, not literal segments, so a `POST /{slide_id}`
    (there isn't one, but a future one would) could otherwise swallow
    `POST /reorder` with `slide_id="reorder"`.
    """
    slides = {slide.id: slide for slide in db.query(HeroSlide).all()}

    if set(payload.ordered_ids) != set(slides.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список слайдов устарел — обновите страницу и попробуйте снова",
        )

    for position, slide_id in enumerate(payload.ordered_ids):
        slides[slide_id].position = position

    db.commit()
    return db.query(HeroSlide).order_by(HeroSlide.position).all()


@router.patch("/{slide_id}", response_model=HeroSlideOut)
async def update_hero_slide(
    slide_id: int,
    title_ru: str | None = Form(None),
    title_tj: str | None = Form(None),
    title_en: str | None = Form(None),
    title_tr: str | None = Form(None),
    product_link: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slide = db.query(HeroSlide).filter(HeroSlide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Слайд не найден — возможно, его уже удалили")

    if title_ru is not None:
        slide.title_ru = title_ru
    if title_tj is not None:
        slide.title_tj = title_tj
    if title_en is not None:
        slide.title_en = title_en
    if title_tr is not None:
        slide.title_tr = title_tr
    if product_link is not None:
        slide.product_link = product_link
    # A form submitted without a new file still sends an `image` part. A
    # plain HTML form leaves it with an empty filename; going through a
    # Next.js server action (as the admin form does) instead turns it into a
    # zero-byte file literally named "undefined" — either way it means "keep
    # the current photo", not "replace it with nothing", so `size` is the
    # reliable signal, not `filename`.
    if image is not None and image.size:
        old_image_path = slide.image_path
        slide.image_path = _save_image(image)
        _delete_image(old_image_path)

    db.commit()
    db.refresh(slide)
    return slide


@router.delete("/{slide_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hero_slide(
    slide_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    slide = db.query(HeroSlide).filter(HeroSlide.id == slide_id).first()
    if not slide:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Слайд не найден — возможно, его уже удалили")

    _delete_image(slide.image_path)
    db.delete(slide)
    db.commit()
