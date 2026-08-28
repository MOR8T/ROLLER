from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.social_link import SocialLink
from app.models.user import User
from app.schemas.social_link import (
    SocialLinkCreate,
    SocialLinkOut,
    SocialLinkReorderRequest,
    SocialLinkUpdate,
)

router = APIRouter(prefix="/api/social-links", tags=["social-links"])


@router.get("", response_model=list[SocialLinkOut])
async def list_social_links(db: Session = Depends(get_db)):
    """Public — the footer reads this on every page, without a token."""
    return db.query(SocialLink).order_by(SocialLink.position).all()


@router.post("", response_model=SocialLinkOut, status_code=status.HTTP_201_CREATED)
async def create_social_link(
    payload: SocialLinkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    max_position = db.query(func.max(SocialLink.position)).scalar()

    link = SocialLink(
        network=payload.network,
        url=payload.url,
        enabled=payload.enabled,
        position=(max_position or 0) + 1,
    )
    db.add(link)
    db.commit()
    db.refresh(link)
    return link


@router.post("/reorder", response_model=list[SocialLinkOut])
async def reorder_social_links(
    payload: SocialLinkReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registered ahead of the `/{link_id}` routes below on purpose: FastAPI
    matches path *shape*, not literal segments, so `POST /{link_id}` could
    otherwise swallow `POST /reorder` with `link_id="reorder"`.
    """
    links = {link.id: link for link in db.query(SocialLink).all()}

    if set(payload.ordered_ids) != set(links.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список ссылок устарел — обновите страницу и попробуйте снова",
        )

    for position, link_id in enumerate(payload.ordered_ids):
        links[link_id].position = position

    db.commit()
    return db.query(SocialLink).order_by(SocialLink.position).all()


@router.patch("/{link_id}", response_model=SocialLinkOut)
async def update_social_link(
    link_id: int,
    payload: SocialLinkUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ссылка не найдена — возможно, её уже удалили",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(link, field, value)

    db.commit()
    db.refresh(link)
    return link


@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_social_link(
    link_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    link = db.query(SocialLink).filter(SocialLink.id == link_id).first()
    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ссылка не найдена — возможно, её уже удалили",
        )

    db.delete(link)
    db.commit()
