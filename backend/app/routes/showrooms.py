import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.showroom import Showroom
from app.models.user import User
from app.schemas.showroom import ShowroomOut, ShowroomReorderRequest

router = APIRouter(prefix="/api/showrooms", tags=["showrooms"])

UPLOAD_DIR = Path("uploads/showrooms")
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

    return f"/uploads/showrooms/{filename}"


def _delete_image(image_path: str) -> None:
    """Best-effort: a missing file is not an error, just nothing to clean up."""
    file_path = UPLOAD_DIR / Path(image_path).name
    if file_path.is_file():
        file_path.unlink()


@router.get("", response_model=list[ShowroomOut])
async def list_showrooms(db: Session = Depends(get_db)):
    """Public — no token required, same as partners/product-categories."""
    return db.query(Showroom).order_by(Showroom.position).all()


@router.post("", response_model=ShowroomOut, status_code=status.HTTP_201_CREATED)
async def create_showroom(
    city_ru: str = Form(...),
    city_tj: str = Form(...),
    city_en: str = Form(...),
    city_tr: str = Form(...),
    address_ru: str = Form(...),
    address_tj: str = Form(...),
    address_en: str = Form(...),
    address_tr: str = Form(...),
    hours_ru: str = Form(...),
    hours_tj: str = Form(...),
    hours_en: str = Form(...),
    hours_tr: str = Form(...),
    phone: str = Form(...),
    lat: float = Form(...),
    lng: float = Form(...),
    route_url: str = Form(...),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    photo_path = _save_image(photo)
    max_position = db.query(func.max(Showroom.position)).scalar()

    showroom = Showroom(
        city_ru=city_ru,
        city_tj=city_tj,
        city_en=city_en,
        city_tr=city_tr,
        address_ru=address_ru,
        address_tj=address_tj,
        address_en=address_en,
        address_tr=address_tr,
        hours_ru=hours_ru,
        hours_tj=hours_tj,
        hours_en=hours_en,
        hours_tr=hours_tr,
        phone=phone,
        lat=lat,
        lng=lng,
        route_url=route_url,
        photo_path=photo_path,
        position=(max_position or 0) + 1,
    )
    db.add(showroom)
    db.commit()
    db.refresh(showroom)
    return showroom


@router.post("/reorder", response_model=list[ShowroomOut])
async def reorder_showrooms(
    payload: ShowroomReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registered ahead of the `/{showroom_id}` routes below on purpose: FastAPI
    matches path *shape*, not literal segments, so a `POST /{showroom_id}`
    (there isn't one, but a future one would) could otherwise swallow
    `POST /reorder` with `showroom_id="reorder"`.
    """
    showrooms = {showroom.id: showroom for showroom in db.query(Showroom).all()}

    if set(payload.ordered_ids) != set(showrooms.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список шоурумов устарел — обновите страницу и попробуйте снова",
        )

    for position, showroom_id in enumerate(payload.ordered_ids):
        showrooms[showroom_id].position = position

    db.commit()
    return db.query(Showroom).order_by(Showroom.position).all()


@router.patch("/{showroom_id}", response_model=ShowroomOut)
async def update_showroom(
    showroom_id: int,
    city_ru: str | None = Form(None),
    city_tj: str | None = Form(None),
    city_en: str | None = Form(None),
    city_tr: str | None = Form(None),
    address_ru: str | None = Form(None),
    address_tj: str | None = Form(None),
    address_en: str | None = Form(None),
    address_tr: str | None = Form(None),
    hours_ru: str | None = Form(None),
    hours_tj: str | None = Form(None),
    hours_en: str | None = Form(None),
    hours_tr: str | None = Form(None),
    phone: str | None = Form(None),
    lat: float | None = Form(None),
    lng: float | None = Form(None),
    route_url: str | None = Form(None),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    showroom = db.query(Showroom).filter(Showroom.id == showroom_id).first()
    if not showroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шоурум не найден — возможно, его уже удалили",
        )

    if city_ru is not None:
        showroom.city_ru = city_ru
    if city_tj is not None:
        showroom.city_tj = city_tj
    if city_en is not None:
        showroom.city_en = city_en
    if city_tr is not None:
        showroom.city_tr = city_tr
    if address_ru is not None:
        showroom.address_ru = address_ru
    if address_tj is not None:
        showroom.address_tj = address_tj
    if address_en is not None:
        showroom.address_en = address_en
    if address_tr is not None:
        showroom.address_tr = address_tr
    if hours_ru is not None:
        showroom.hours_ru = hours_ru
    if hours_tj is not None:
        showroom.hours_tj = hours_tj
    if hours_en is not None:
        showroom.hours_en = hours_en
    if hours_tr is not None:
        showroom.hours_tr = hours_tr
    if phone is not None:
        showroom.phone = phone
    if lat is not None:
        showroom.lat = lat
    if lng is not None:
        showroom.lng = lng
    if route_url is not None:
        showroom.route_url = route_url
    # A form submitted without a new file still sends a `photo` part. A plain
    # HTML form leaves it with an empty filename; going through a Next.js
    # server action (as the admin form does) instead turns it into a
    # zero-byte file literally named "undefined" — either way it means "keep
    # the current photo", not "replace it with nothing", so `size` is the
    # reliable signal, not `filename`.
    if photo is not None and photo.size:
        old_photo_path = showroom.photo_path
        showroom.photo_path = _save_image(photo)
        _delete_image(old_photo_path)

    db.commit()
    db.refresh(showroom)
    return showroom


@router.delete("/{showroom_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_showroom(
    showroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    showroom = db.query(Showroom).filter(Showroom.id == showroom_id).first()
    if not showroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Шоурум не найден — возможно, его уже удалили",
        )

    _delete_image(showroom.photo_path)
    db.delete(showroom)
    db.commit()
