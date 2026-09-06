import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.site_settings import SiteSettings
from app.models.user import User
from app.schemas.site_settings import (
    PreviewCodeOut,
    PreviewCodeUpdate,
    SiteSettingsAdminOut,
    SiteSettingsOut,
    SiteSettingsUpdate,
)
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

    Which is why the response model is `SiteSettingsOut` and not the admin one
    — the code itself never leaves through this door.
    """
    return _get_or_create(db)


@router.get("/admin", response_model=SiteSettingsAdminOut)
async def get_site_settings_admin(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """«Настройки сайта»'s own read — the same row plus the preview code."""
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


@router.put("/preview-code", response_model=SiteSettingsAdminOut)
async def update_preview_code(
    payload: PreviewCodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sets or clears the code that gets a visitor past the placeholder.

    Changing it revokes every browser already holding the old one: the
    frontend keeps the code in an httpOnly cookie and re-checks it on every
    render against what it last read from `GET /preview-code` below, so there
    is no session list to invalidate. `updatePreviewCodeAction` revalidates
    the `site-settings` tag on save, which is what drops the frontend's cached
    copy of the old code immediately rather than up to 60s later.
    """
    settings = _get_or_create(db)
    settings.preview_code = payload.preview_code
    db.commit()
    db.refresh(settings)
    return settings


@router.get("/preview-code", response_model=PreviewCodeOut)
async def read_preview_code(
    x_internal_token: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    """
    Hands the preview code to the Next.js server, which is the only caller.

    ⚠️ Service-to-service, and the only route here that returns a secret to a
    caller with no login. Two things keep it that way and both have to stay:

      * `X-Internal-Token` — a shared secret set on both containers. Unset on
        this side means the route is *off* (503), not open; a wrong value is
        401. Compared with `compare_digest` like every other secret here.
      * `nginx/includes/app-locations.inc` denies this exact path, so even a
        leaked token is not reachable from outside the Compose network.

    Why the code leaves at all: the check used to live here, and every render
    of the previewed site posted to it — which the old attempt throttle
    counted, so a visitor holding a *valid* code locked themselves (and
    everyone else, since the caller was the frontend container's single IP)
    out within a handful of page views. The comparison and the retry limit are
    the frontend's now (`frontend/lib/maintenance-access.ts`,
    `frontend/lib/maintenance-throttle.ts`), and this route is read once per
    cache window instead of three times per page.
    """
    expected_token = (get_settings().internal_api_token or "").strip()
    if not expected_token:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="INTERNAL_API_TOKEN is not configured.",
        )
    if not x_internal_token or not secrets.compare_digest(x_internal_token, expected_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authorized")

    settings = _get_or_create(db)
    return PreviewCodeOut(preview_code=(settings.preview_code or "").strip() or None)
