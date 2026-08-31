from sqlalchemy import Column, DateTime, Integer, String
from datetime import datetime
from app.database import Base


class ContactInterest(Base):
    """One checkbox option in `ContactsLeadSection`'s "Что вас интересует?"
    list — same reorderable-list shape as `Showroom`/`AboutTimelineItem`,
    minus the file upload."""

    __tablename__ = "contact_interests"

    id = Column(Integer, primary_key=True, index=True)
    label_ru = Column(String, nullable=False)
    label_tj = Column(String, nullable=False)
    label_en = Column(String, nullable=False)
    label_tr = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ContactInterest(id={self.id}, label_ru='{self.label_ru}')>"
