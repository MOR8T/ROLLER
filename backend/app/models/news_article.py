from sqlalchemy import Column, Date, DateTime, Integer, String, Text
from datetime import datetime
from app.database import Base

class NewsArticle(Base):
    __tablename__ = "news_articles"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, nullable=False, unique=True, index=True)
    cover_path = Column(String, nullable=False)
    published_at = Column(Date, nullable=False)

    title_ru = Column(String, nullable=False)
    title_tj = Column(String, nullable=False)
    title_en = Column(String, nullable=False)
    title_tr = Column(String, nullable=False)

    # Short summary — subtitle on the article page and `<meta description>`.
    # Optional: a blank one falls back to a trimmed `body_*` at read time
    # (`lib/news.ts`), not here — the backend stores exactly what the admin typed.
    excerpt_ru = Column(String, nullable=True)
    excerpt_tj = Column(String, nullable=True)
    excerpt_en = Column(String, nullable=True)
    excerpt_tr = Column(String, nullable=True)

    # Tiptap's HTML output, one per locale.
    body_ru = Column(Text, nullable=False)
    body_tj = Column(Text, nullable=False)
    body_en = Column(Text, nullable=False)
    body_tr = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<NewsArticle(id={self.id}, slug='{self.slug}')>"
