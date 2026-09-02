from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.site_settings import SiteSettings
from app.models.user import User
from app.schemas.site_settings import SiteSettingsOut, SiteSettingsUpdate
from app.startup import seed_site_settings

router = APIRouter(prefix="/api/site-settings", tags=["site-settings"])


def _get_or_create(db: Session) -> SiteSettings:
    """Same defensive fallback as `contact_info.py`'s — `seed_site_settings`
    runs at every boot and should already have made row 1 exist."""
    settings = db.query(SiteSettings).first()
    if settings is None:
        seed_site_settings(db)
        settings = db.query(SiteSettings).first()
    return settings


@router.get("", response_model=SiteSettingsOut)
async def get_site_settings(db: Session = Depends(get_db)):
    """
    Public, and it has to be: the site's own root layout reads this on every
    page render to decide whether to show the maintenance screen, and that
    render has no admin token.
    """
    return _get_or_create(db)


@router.put("", response_model=SiteSettingsOut)
async def update_site_settings(
    payload: SiteSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    settings = _get_or_create(db)
    settings.maintenance_mode = payload.maintenance_mode
    db.commit()
    db.refresh(settings)
    return settings
