from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database import Base

class Showroom(Base):
    __tablename__ = "showrooms"

    id = Column(Integer, primary_key=True, index=True)
    city_ru = Column(String, nullable=False)
    city_tj = Column(String, nullable=False)
    city_en = Column(String, nullable=False)
    city_tr = Column(String, nullable=False)
    address_ru = Column(String, nullable=False)
    address_tj = Column(String, nullable=False)
    address_en = Column(String, nullable=False)
    address_tr = Column(String, nullable=False)
    hours_ru = Column(String, nullable=False)
    hours_tj = Column(String, nullable=False)
    hours_en = Column(String, nullable=False)
    hours_tr = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    route_url = Column(String, nullable=False)
    photo_path = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Showroom(id={self.id}, city_ru='{self.city_ru}')>"
