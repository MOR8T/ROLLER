import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.partner import Partner
from app.models.user import User
from app.schemas.partner import PartnerOut, PartnerReorderRequest

router = APIRouter(prefix="/api/partners", tags=["partners"])

UPLOAD_DIR = Path("uploads/partners")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB — kept in sync with the admin form's own check


def _save_image(image: UploadFile) -> str:
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Допустимы только изображения (JPEG, PNG, WebP, SVG, GIF)",
        )

    content = image.file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Размер файла не должен превышать 10 МБ",
        )

    extension = Path(image.filename or "").suffix or ".png"
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    with destination.open("wb") as buffer:
        buffer.write(content)

    return f"/uploads/partners/{filename}"


def _delete_image(image_path: str) -> None:
    """Best-effort: a missing file is not an error, just nothing to clean up."""
    file_path = UPLOAD_DIR / Path(image_path).name
    if file_path.is_file():
        file_path.unlink()


@router.get("", response_model=list[PartnerOut])
async def list_partners(db: Session = Depends(get_db)):
    """Public — the homepage and the about page read this without a token."""
    return db.query(Partner).order_by(Partner.position).all()


@router.post("", response_model=PartnerOut, status_code=status.HTTP_201_CREATED)
async def create_partner(
    name: str = Form(...),
    logo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logo_path = _save_image(logo)
    max_position = db.query(func.max(Partner.position)).scalar()

    partner = Partner(name=name, logo_path=logo_path, position=(max_position or 0) + 1)
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.post("/reorder", response_model=list[PartnerOut])
async def reorder_partners(
    payload: PartnerReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registered ahead of the `/{partner_id}` routes below on purpose: FastAPI
    matches path *shape*, not literal segments, so a `POST /{partner_id}`
    (there isn't one, but a future one would) could otherwise swallow
    `POST /reorder` with `partner_id="reorder"`.
    """
    partners = {partner.id: partner for partner in db.query(Partner).all()}

    if set(payload.ordered_ids) != set(partners.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список партнёров устарел — обновите страницу и попробуйте снова",
        )

    for position, partner_id in enumerate(payload.ordered_ids):
        partners[partner_id].position = position

    db.commit()
    return db.query(Partner).order_by(Partner.position).all()


@router.patch("/{partner_id}", response_model=PartnerOut)
async def update_partner(
    partner_id: int,
    name: str | None = Form(None),
    logo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Партнёр не найден — возможно, его уже удалили",
        )

    if name is not None:
        partner.name = name
    # A form submitted without a new file still sends a `logo` part. A plain
    # HTML form leaves it with an empty filename; going through a Next.js
    # server action (as the admin form does) instead turns it into a
    # zero-byte file literally named "undefined" — either way it means "keep
    # the current logo", not "replace it with nothing", so `size` is the
    # reliable signal, not `filename`.
    if logo is not None and logo.size:
        old_logo_path = partner.logo_path
        partner.logo_path = _save_image(logo)
        _delete_image(old_logo_path)

    db.commit()
    db.refresh(partner)
    return partner


@router.delete("/{partner_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_partner(
    partner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    partner = db.query(Partner).filter(Partner.id == partner_id).first()
    if not partner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Партнёр не найден — возможно, его уже удалили",
        )

    _delete_image(partner.logo_path)
    db.delete(partner)
    db.commit()
