from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.contact_info import ContactInfo
from app.models.user import User
from app.schemas.contact_info import ContactInfoOut, ContactInfoUpdate
from app.startup import seed_contact_info

router = APIRouter(prefix="/api/contact-info", tags=["contact-info"])


def _get_or_create(db: Session) -> ContactInfo:
    """
    `seed_contact_info()` runs at every boot and should always have made row
    1 exist by the time a request lands — this is a defensive fallback for
    the case that hasn't, not the primary path.
    """
    contact = db.query(ContactInfo).first()
    if contact is None:
        seed_contact_info(db)
        contact = db.query(ContactInfo).first()
    return contact


@router.get("", response_model=ContactInfoOut)
async def get_contact_info(db: Session = Depends(get_db)):
    """Public — `ContactsLeadSection` reads this on every page it appears on, without a token."""
    return _get_or_create(db)


@router.patch("", response_model=ContactInfoOut)
async def update_contact_info(
    payload: ContactInfoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = _get_or_create(db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)
    return contact
