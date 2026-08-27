from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.about_timeline_item import AboutTimelineItem
from app.models.user import User
from app.schemas.about_timeline_item import AboutTimelineItemOut, AboutTimelineItemReorderRequest

router = APIRouter(prefix="/api/about-timeline", tags=["about-timeline"])


@router.get("", response_model=list[AboutTimelineItemOut])
async def list_timeline_items(db: Session = Depends(get_db)):
    """Public — no token required, same as partners/showrooms."""
    return db.query(AboutTimelineItem).order_by(AboutTimelineItem.position).all()


@router.post("", response_model=AboutTimelineItemOut, status_code=status.HTTP_201_CREATED)
async def create_timeline_item(
    year_ru: str = Form(...),
    year_tj: str = Form(...),
    year_en: str = Form(...),
    year_tr: str = Form(...),
    title_ru: str = Form(...),
    title_tj: str = Form(...),
    title_en: str = Form(...),
    title_tr: str = Form(...),
    description_ru: str = Form(...),
    description_tj: str = Form(...),
    description_en: str = Form(...),
    description_tr: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    max_position = db.query(func.max(AboutTimelineItem.position)).scalar()

    item = AboutTimelineItem(
        year_ru=year_ru,
        year_tj=year_tj,
        year_en=year_en,
        year_tr=year_tr,
        title_ru=title_ru,
        title_tj=title_tj,
        title_en=title_en,
        title_tr=title_tr,
        description_ru=description_ru,
        description_tj=description_tj,
        description_en=description_en,
        description_tr=description_tr,
        position=(max_position or 0) + 1,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/reorder", response_model=list[AboutTimelineItemOut])
async def reorder_timeline_items(
    payload: AboutTimelineItemReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registered ahead of the `/{item_id}` routes below on purpose: FastAPI
    matches path *shape*, not literal segments, so a `POST /{item_id}`
    (there isn't one, but a future one would) could otherwise swallow
    `POST /reorder` with `item_id="reorder"`.
    """
    items = {item.id: item for item in db.query(AboutTimelineItem).all()}

    if set(payload.ordered_ids) != set(items.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список этапов устарел — обновите страницу и попробуйте снова",
        )

    for position, item_id in enumerate(payload.ordered_ids):
        items[item_id].position = position

    db.commit()
    return db.query(AboutTimelineItem).order_by(AboutTimelineItem.position).all()


@router.patch("/{item_id}", response_model=AboutTimelineItemOut)
async def update_timeline_item(
    item_id: int,
    year_ru: str | None = Form(None),
    year_tj: str | None = Form(None),
    year_en: str | None = Form(None),
    year_tr: str | None = Form(None),
    title_ru: str | None = Form(None),
    title_tj: str | None = Form(None),
    title_en: str | None = Form(None),
    title_tr: str | None = Form(None),
    description_ru: str | None = Form(None),
    description_tj: str | None = Form(None),
    description_en: str | None = Form(None),
    description_tr: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(AboutTimelineItem).filter(AboutTimelineItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Этап не найден — возможно, его уже удалили",
        )

    if year_ru is not None:
        item.year_ru = year_ru
    if year_tj is not None:
        item.year_tj = year_tj
    if year_en is not None:
        item.year_en = year_en
    if year_tr is not None:
        item.year_tr = year_tr
    if title_ru is not None:
        item.title_ru = title_ru
    if title_tj is not None:
        item.title_tj = title_tj
    if title_en is not None:
        item.title_en = title_en
    if title_tr is not None:
        item.title_tr = title_tr
    if description_ru is not None:
        item.description_ru = description_ru
    if description_tj is not None:
        item.description_tj = description_tj
    if description_en is not None:
        item.description_en = description_en
    if description_tr is not None:
        item.description_tr = description_tr

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timeline_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(AboutTimelineItem).filter(AboutTimelineItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Этап не найден — возможно, его уже удалили",
        )

    db.delete(item)
    db.commit()
