from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class AboutTimelineItem(Base):
    """One milestone in `/about`'s "Как компания росла" timeline."""

    __tablename__ = "about_timeline_items"

    id = Column(Integer, primary_key=True, index=True)
    year_ru = Column(String, nullable=False)
    year_tj = Column(String, nullable=False)
    year_en = Column(String, nullable=False)
    year_tr = Column(String, nullable=False)
    title_ru = Column(String, nullable=False)
    title_tj = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    title_tr = Column(String, nullable=False)
    description_ru = Column(String, nullable=False)
    description_tj = Column(String, nullable=False)
    description_en = Column(String, nullable=False)
    description_tr = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AboutTimelineItem(id={self.id}, year_ru='{self.year_ru}')>"
