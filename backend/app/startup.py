import logging

from app.config import get_settings
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password

logger = logging.getLogger(__name__)


def seed_initial_admin() -> None:
    """
    Creates the first admin user from INITIAL_ADMIN_* env vars, if set and if
    no user with that username exists yet. There is no `/register` endpoint —
    this is the only way a fresh database gets a user to log in with.

    Idempotent: safe to call on every startup, including against an already
    seeded database or one with no INITIAL_ADMIN_* configured at all.
    """
    settings = get_settings()

    if not (
        settings.initial_admin_username
        and settings.initial_admin_email
        and settings.initial_admin_password
    ):
        logger.info("Initial admin seed skipped: INITIAL_ADMIN_* not fully set")
        return

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.username == settings.initial_admin_username).first()
        if existing:
            logger.info(
                "Initial admin seed skipped: user %r already exists",
                settings.initial_admin_username,
            )
            return

        user = User(
            username=settings.initial_admin_username,
            email=settings.initial_admin_email,
            hashed_password=hash_password(settings.initial_admin_password),
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        logger.info("Seeded initial admin user %r", settings.initial_admin_username)
    finally:
        db.close()
