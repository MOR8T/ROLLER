from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class ProductCategory(Base):
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name_ru = Column(String, nullable=False)
    name_tj = Column(String, nullable=False)
    name_en = Column(String, nullable=False)
    name_tr = Column(String, nullable=False)
    image_path = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ProductCategory(id={self.id}, name_ru='{self.name_ru}')>"
