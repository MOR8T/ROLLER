from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class AboutCertificate(Base):
    """
    One certificate scan in `/about`'s certificates slider. `title_*` backs
    the image's `alt` text and the lightbox caption — the card itself shows
    the photo only, per the client's 2026-08-27 request.
    """

    __tablename__ = "about_certificates"

    id = Column(Integer, primary_key=True, index=True)
    title_ru = Column(String, nullable=False)
    title_tj = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    title_tr = Column(String, nullable=False)
    image_path = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AboutCertificate(id={self.id}, title_ru='{self.title_ru}')>"
