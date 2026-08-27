from sqlalchemy import Boolean, Column, DateTime, Integer, String
from datetime import datetime
from app.database import Base


class ContactInfo(Base):
    """
    Singleton — the one row (id=1) behind `ContactsLeadSection`'s contact
    list (rendered on `/contacts` and six other pages) and the footer's
    contact/social columns. Same shape as `AboutContent`: `address_*` is
    per-locale text; `phone`/`email`/`whatsapp`/`map_url` are
    locale-independent — the `tel:`/`mailto:`/`wa.me` hrefs are derived from
    them at read time (`lib/contact-info.ts`), not stored separately.

    `social_*_enabled` lets the admin hide a social link from the footer
    without losing the URL underneath it — unchecking it is reversible,
    clearing the URL field is not.
    """

    __tablename__ = "contact_info"

    id = Column(Integer, primary_key=True, index=True)

    address_ru = Column(String, nullable=False)
    address_tj = Column(String, nullable=False)
    address_en = Column(String, nullable=False)
    address_tr = Column(String, nullable=False)
    map_url = Column(String, nullable=False)

    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    whatsapp = Column(String, nullable=False)

    social_instagram_url = Column(String, nullable=False, default="")
    social_instagram_enabled = Column(Boolean, nullable=False, default=True)
    social_telegram_url = Column(String, nullable=False, default="")
    social_telegram_enabled = Column(Boolean, nullable=False, default=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<ContactInfo(id={self.id})>"
