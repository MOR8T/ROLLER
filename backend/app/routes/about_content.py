from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.about_content import AboutContent
from app.models.user import User
from app.schemas.about_content import AboutContentOut, AboutContentUpdate
from app.startup import seed_about_content

router = APIRouter(prefix="/api/about-content", tags=["about-content"])


def _get_or_create(db: Session) -> AboutContent:
    """
    `seed_about_content()` runs at every boot and should always have made row
    1 exist by the time a request lands — this is a defensive fallback for
    the case that hasn't, not the primary path.
    """
    content = db.query(AboutContent).first()
    if content is None:
        seed_about_content(db)
        content = db.query(AboutContent).first()
    return content


@router.get("", response_model=AboutContentOut)
async def get_about_content(db: Session = Depends(get_db)):
    """Public — the homepage's stats block and `/about` both read this without a token."""
    return _get_or_create(db)


@router.patch("", response_model=AboutContentOut)
async def update_about_content(
    payload: AboutContentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content = _get_or_create(db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(content, field, value)

    db.commit()
    db.refresh(content)
    return content
