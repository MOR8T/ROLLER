from fastapi import APIRouter, Depends, Form, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.contact_interest import ContactInterest
from app.models.user import User
from app.schemas.contact_interest import ContactInterestOut, ContactInterestReorderRequest

router = APIRouter(prefix="/api/contact-interests", tags=["contact-interests"])


@router.get("", response_model=list[ContactInterestOut])
async def list_contact_interests(db: Session = Depends(get_db)):
    """Public — no token required, same as partners/about-timeline."""
    return db.query(ContactInterest).order_by(ContactInterest.position).all()


@router.post("", response_model=ContactInterestOut, status_code=status.HTTP_201_CREATED)
async def create_contact_interest(
    label_ru: str = Form(...),
    label_tj: str = Form(...),
    label_en: str = Form(...),
    label_tr: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    max_position = db.query(func.max(ContactInterest.position)).scalar()

    item = ContactInterest(
        label_ru=label_ru,
        label_tj=label_tj,
        label_en=label_en,
        label_tr=label_tr,
        position=(max_position or 0) + 1,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/reorder", response_model=list[ContactInterestOut])
async def reorder_contact_interests(
    payload: ContactInterestReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registered ahead of the `/{interest_id}` routes below on purpose:
    FastAPI matches path *shape*, not literal segments, so a future
    `POST /{interest_id}` could otherwise swallow `POST /reorder` with
    `interest_id="reorder"`.
    """
    items = {item.id: item for item in db.query(ContactInterest).all()}

    if set(payload.ordered_ids) != set(items.keys()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Список пунктов устарел — обновите страницу и попробуйте снова",
        )

    for position, item_id in enumerate(payload.ordered_ids):
        items[item_id].position = position

    db.commit()
    return db.query(ContactInterest).order_by(ContactInterest.position).all()


@router.patch("/{interest_id}", response_model=ContactInterestOut)
async def update_contact_interest(
    interest_id: int,
    label_ru: str | None = Form(None),
    label_tj: str | None = Form(None),
    label_en: str | None = Form(None),
    label_tr: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContactInterest).filter(ContactInterest.id == interest_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пункт не найден — возможно, его уже удалили",
        )

    if label_ru is not None:
        item.label_ru = label_ru
    if label_tj is not None:
        item.label_tj = label_tj
    if label_en is not None:
        item.label_en = label_en
    if label_tr is not None:
        item.label_tr = label_tr

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{interest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contact_interest(
    interest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(ContactInterest).filter(ContactInterest.id == interest_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пункт не найден — возможно, его уже удалили",
        )

    db.delete(item)
    db.commit()
