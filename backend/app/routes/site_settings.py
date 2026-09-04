import secrets
import time
from collections import defaultdict, deque

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.site_settings import SiteSettings
from app.models.user import User
from app.schemas.site_settings import (
    PreviewAccessRequest,
    PreviewAccessResult,
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


# ── Preview-code throttle ───────────────────────────────────────────────────
# The one unauthenticated endpoint in this app that compares a secret, and the
# secret is short and human-typeable, so an unthrottled version is a few hours
# of scripted guessing away from being no gate at all.
#
# ⚠️ Deliberately modest, and honest about it: an in-process dict is per
# worker, so N workers allow N × the limit, and a restart forgets everything.
# It is not a defence against a distributed attacker — it is what turns "spray
# codes as fast as the network allows" into "a rate a person could have typed",
# which is the whole threat model for a door code that guards a preview of a
# site that will be public anyway. If this ever needs to be real, it belongs in
# nginx or Redis, not here.
_ATTEMPT_WINDOW_SECONDS = 300
_MAX_ATTEMPTS_PER_WINDOW = 10
_attempts: dict[str, deque[float]] = defaultdict(deque)


def _client_key(request: Request) -> str:
    """First hop of `X-Forwarded-For` when there is one — behind the
    production nginx `request.client.host` is the proxy, i.e. one bucket for
    every visitor on earth."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _too_many_attempts(request: Request) -> bool:
    """Records this attempt and reports whether the caller is over the limit."""
    now = time.monotonic()
    bucket = _attempts[_client_key(request)]
    while bucket and now - bucket[0] > _ATTEMPT_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= _MAX_ATTEMPTS_PER_WINDOW:
        return True
    bucket.append(now)
    return False


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
    frontend keeps the code in an httpOnly cookie and re-checks it here on
    each render, so there is no session list to invalidate — the next request
    from an old cookie simply fails this comparison.
    """
    settings = _get_or_create(db)
    settings.preview_code = payload.preview_code
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/preview-access", response_model=PreviewAccessResult)
async def check_preview_access(
    payload: PreviewAccessRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    """
    Public: the placeholder's code prompt, and the per-render re-check of the
    cookie that prompt sets. Answers `{"valid": bool}` and nothing else.

    POST rather than GET even though it reads: the code would otherwise sit in
    the URL, i.e. in the access log and in every proxy along the way — the
    same reason `login-actions.ts` is a Server Action.
    """
    if _too_many_attempts(request):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много попыток. Попробуйте позже.",
        )

    settings = _get_or_create(db)
    expected = (settings.preview_code or "").strip()
    if not expected:
        return PreviewAccessResult(valid=False)

    # `compare_digest`, not `==`: constant-time, so the response time cannot be
    # used to learn the code prefix by prefix.
    return PreviewAccessResult(valid=secrets.compare_digest(payload.code.strip(), expected))
