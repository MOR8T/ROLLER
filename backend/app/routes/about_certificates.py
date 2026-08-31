import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.about_certificate import AboutCertificate
from app.models.user import User
from app.schemas.about_certificate import AboutCertificateOut, AboutCertificateReorderRequest

router = APIRouter(prefix="/api/about-certificates", tags=["about-certificates"])

UPLOAD_DIR = Path("uploads/about-certificates")
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

    return f"/uploads/about-certificates/{filename}"


def _delete_image(image_path: str) -> None:
    """
    Best-effort: a missing file is not an error, just nothing to clean up.
    Also a no-op for the seeded certificates, whose `image_path` points at
    `frontend/public/about/certificates/*` rather than this directory —
    deleting one of those rows should not touch a file this route never
    wrote.
    """
    file_path = UPLOAD_DIR / Path(image_path).name
    if file_path.is_file():
        file_path.unlink()


@router.get("", response_model=list[AboutCertificateOut])
async def list_certificates(db: Session = Depends(get_db)):
    """Public — `/about`'s certificates slider reads this without a token."""
    return db.query(AboutCertificate).order_by(AboutCertificate.position).all()


@router.post("", response_model=AboutCertificateOut, status_code=status.HTTP_201_CREATED)
async def create_certificate(
    title_ru: str = Form(...),
    title_tj: str = Form(...),
    title_en: str = Form(...),
    title_tr: str = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_path = _save_image(image)
    max_position = db.query(func.max(AboutCertificate.position)).scalar()

    certificate = AboutCertificate(
        title_ru=title_ru,
        title_tj=title_tj,
        title_en=title_en,
        title_tr=title_tr,
        image_path=image_path,
        position=(max_position or 0) + 1,
    )
    db.add(certificate)
    db.commit()
    db.refresh(certificate)
    return certificate


@router.post("/reorder", response_model=list[AboutCertificateOut])
async def reorder_certificates(
    payload: AboutCertificateReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registered ahead of the `/{certificate_id}` routes below on purpose:
    FastAPI matches path *shape*, not literal segments, so a
    `POST /{certificate_id}` (there isn't one, but a future one would) could
    otherwise swallow `POST /reorder` with `certificate_id="reorder"`.
    """
    certificates = {cert.id: cert for cert in db.query(AboutCertificate).all()}

    if set(payload.ordered_ids) != set(certificates.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список сертификатов устарел — обновите страницу и попробуйте снова",
        )

    for position, certificate_id in enumerate(payload.ordered_ids):
        certificates[certificate_id].position = position

    db.commit()
    return db.query(AboutCertificate).order_by(AboutCertificate.position).all()


@router.patch("/{certificate_id}", response_model=AboutCertificateOut)
async def update_certificate(
    certificate_id: int,
    title_ru: str | None = Form(None),
    title_tj: str | None = Form(None),
    title_en: str | None = Form(None),
    title_tr: str | None = Form(None),
    image: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    certificate = (
        db.query(AboutCertificate).filter(AboutCertificate.id == certificate_id).first()
    )
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден — возможно, его уже удалили",
        )

    if title_ru is not None:
        certificate.title_ru = title_ru
    if title_tj is not None:
        certificate.title_tj = title_tj
    if title_en is not None:
        certificate.title_en = title_en
    if title_tr is not None:
        certificate.title_tr = title_tr
    # A form submitted without a new file still sends an `image` part. A plain
    # HTML form leaves it with an empty filename; going through a Next.js
    # server action (as the admin form does) instead turns it into a
    # zero-byte file literally named "undefined" — either way it means "keep
    # the current image", not "replace it with nothing", so `size` is the
    # reliable signal, not `filename`.
    if image is not None and image.size:
        old_image_path = certificate.image_path
        certificate.image_path = _save_image(image)
        _delete_image(old_image_path)

    db.commit()
    db.refresh(certificate)
    return certificate


@router.delete("/{certificate_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_certificate(
    certificate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    certificate = (
        db.query(AboutCertificate).filter(AboutCertificate.id == certificate_id).first()
    )
    if not certificate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сертификат не найден — возможно, его уже удалили",
        )

    _delete_image(certificate.image_path)
    db.delete(certificate)
    db.commit()
