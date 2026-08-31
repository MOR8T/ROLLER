import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.calculator_settings import CalculatorSettings
from app.models.user import User
from app.schemas.calculator_settings import CalculatorSettingsOut, CalculatorSettingsUpdate
from app.startup import seed_calculator_settings

router = APIRouter(prefix="/api/calculator-settings", tags=["calculator-settings"])

UPLOAD_DIR = Path("uploads/calculator")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# No GIF, unlike `hero_slides`: this image is tiled into an SVG `<pattern>` as
# the profile's lamination, and an animated tile there is never intended.
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB — same ceiling as hero slides


def _get_or_create(db: Session) -> CalculatorSettings:
    """Same defensive fallback as `ContactInfo`'s — `seed_calculator_settings`
    runs at every boot and should already have made row 1 exist."""
    settings = db.query(CalculatorSettings).first()
    if settings is None:
        seed_calculator_settings(db)
        settings = db.query(CalculatorSettings).first()
    return settings


@router.get("", response_model=CalculatorSettingsOut)
async def get_calculator_settings(db: Session = Depends(get_db)):
    """Public — nothing here is sensitive, and the frontend will eventually
    read it on the calculator page itself."""
    return _get_or_create(db)


@router.put("", response_model=CalculatorSettingsOut)
async def update_calculator_settings(
    payload: CalculatorSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """A full replace, not a patch — every list here is edited as a whole in
    the admin panel (add/remove/reorder an entry), so there is no partial
    shape that would mean anything."""
    settings = _get_or_create(db)

    settings.series = [item.model_dump() for item in payload.series]
    settings.mechanisms = [item.model_dump() for item in payload.mechanisms]
    settings.accessories = [item.model_dump() for item in payload.accessories]
    settings.lamination_colors = [item.model_dump() for item in payload.lamination_colors]
    settings.size_limits = payload.size_limits.model_dump()

    db.commit()
    db.refresh(settings)
    return settings


@router.post("/texture", status_code=status.HTTP_201_CREATED)
async def upload_texture(
    image: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Stores one lamination photograph and hands back its path.

    Separate from the `PUT` above because the settings themselves travel as
    one JSON body: a multipart upload cannot ride along in it, and the admin
    uploads a texture at a different moment from when they press "Сохранить".
    The returned path is what the caller writes into that colour's `texture`
    field — nothing here touches the settings row, so an upload the admin then
    abandons leaves the saved palette untouched.

    The file is deliberately not deleted when a colour is removed or its
    texture replaced: several colours may point at one path, and an orphaned
    image costs a few hundred KB, while deleting one still in use empties a
    swatch on the live site.
    """
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Допустимы только изображения (JPEG, PNG, WebP)",
        )

    content = image.file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Размер файла не должен превышать 10 МБ",
        )

    extension = Path(image.filename or "").suffix or ".png"
    filename = f"{uuid.uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(content)

    return {"path": f"/uploads/calculator/{filename}"}
