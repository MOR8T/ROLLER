from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class HeroSlide(Base):
    __tablename__ = "hero_slides"

    id = Column(Integer, primary_key=True, index=True)
    title_ru = Column(String, nullable=False)
    title_tj = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    title_tr = Column(String, nullable=False)
    image_path = Column(String, nullable=False)
    product_link = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<HeroSlide(id={self.id}, title_ru='{self.title_ru}', position={self.position})>"
