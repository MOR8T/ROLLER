from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB

from app.database import Base


class Lead(Base):
    """
    A visitor request, captured before it reaches WhatsApp.

    `lib/leads.ts` on the frontend has always documented "store first, send to
    WhatsApp second" as the required order — a visitor who opens WhatsApp and
    never presses send should not simply disappear. Until now there was
    nowhere to store to; this table is that place.

    Two shapes come through it, told apart by `kind`:
    - `"full"` — the site's one request form (`RequestForm`), used by the
      calculator's "Отправить" and the quote/dealer forms. Carries `scenario`,
      `city`, `product_type`, and — only from the calculator — `configuration`,
      the human-readable read-out of every position the visitor built.
    - `"quick"` — the short "Свяжитесь с нами" form: a phone number and, if
      given, a name, ticked catalogue interests, a free-text message, and
      `context` (which block on the site it came from).

    Columns the other shape doesn't use stay null rather than forcing one
    shape's fields onto the other — same reasoning as `Product.image_path`.
    """

    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String, nullable=False)

    name = Column(String, nullable=True)
    phone = Column(String, nullable=False)

    # "full" form fields
    scenario = Column(String, nullable=True)
    city = Column(String, nullable=True)
    product_type = Column(String, nullable=True)
    comment = Column(Text, nullable=True)
    configuration = Column(Text, nullable=True)

    # "quick" form fields
    interests = Column(JSONB, nullable=True)
    context = Column(String, nullable=True)
    message = Column(Text, nullable=True)

    # Admin-side triage only — not a status workflow (the brief explicitly
    # asks for none): one flag for "the sales desk has already called this
    # person", so a growing list stays usable without becoming a pipeline.
    is_reviewed = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Lead(id={self.id}, kind='{self.kind}', phone='{self.phone}')>"
