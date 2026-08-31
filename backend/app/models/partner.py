from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Partner(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    logo_path = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Partner(id={self.id}, name='{self.name}')>"
