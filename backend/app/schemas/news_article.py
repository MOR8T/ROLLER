from datetime import date

from pydantic import BaseModel


class NewsArticleOut(BaseModel):
    id: int
    slug: str
    cover_path: str
    published_at: date

    title_ru: str
    title_tj: str
    title_en: str
    title_tr: str

    excerpt_ru: str | None
    excerpt_tj: str | None
    excerpt_en: str | None
    excerpt_tr: str | None

    body_ru: str
    body_tj: str
    body_en: str
    body_tr: str

    class Config:
        from_attributes = True
