import re
import uuid
from datetime import date
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.news_article import NewsArticle
from app.models.user import User
from app.schemas.news_article import NewsArticleOut

router = APIRouter(prefix="/api/news", tags=["news"])

UPLOAD_DIR = Path("uploads/news")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB — kept in sync with the admin form's own check

_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh",
    "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m", "н": "n", "о": "o",
    "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f", "х": "h", "ц": "c",
    "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu",
    "я": "ya",
}


def _slugify(text: str) -> str:
    """Cyrillic-aware slugify — the admin types a Russian title, the URL needs
    Latin (see the site's slug contract in `i18n/routing.ts`)."""
    transliterated = "".join(_TRANSLIT.get(char, char) for char in text.lower())
    slug = re.sub(r"[^a-z0-9]+", "-", transliterated).strip("-")
    return slug or "novost"


def _unique_slug(db: Session, base_slug: str, exclude_id: int | None = None) -> str:
    slug = base_slug
    suffix = 2
    while True:
        query = db.query(NewsArticle).filter(NewsArticle.slug == slug)
        if exclude_id is not None:
            query = query.filter(NewsArticle.id != exclude_id)
        if not query.first():
            return slug
        slug = f"{base_slug}-{suffix}"
        suffix += 1


def _save_image(image: UploadFile) -> str:
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Допустимы только изображения (JPEG, PNG, WebP, GIF)",
        )

    content = image.file.read()
    if len(content) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Размер файла не должен превышать 10 МБ",
        )

    extension = Path(image.filename or "").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    with destination.open("wb") as buffer:
        buffer.write(content)

    return f"/uploads/news/{filename}"


def _delete_image(image_path: str) -> None:
    """Best-effort: a missing file is not an error, just nothing to clean up."""
    file_path = UPLOAD_DIR / Path(image_path).name
    if file_path.is_file():
        file_path.unlink()


@router.get("", response_model=list[NewsArticleOut])
async def list_news(db: Session = Depends(get_db)):
    """Public — the homepage and `/news` read this without a token. Newest
    first: news has no manual ordering, `published_at` decides the order."""
    return db.query(NewsArticle).order_by(desc(NewsArticle.published_at)).all()


@router.post("", response_model=NewsArticleOut, status_code=status.HTTP_201_CREATED)
async def create_news_article(
    published_at: date = Form(...),
    title_ru: str = Form(...),
    title_tj: str = Form(...),
    title_en: str = Form(...),
    title_tr: str = Form(...),
    excerpt_ru: str | None = Form(None),
    excerpt_tj: str | None = Form(None),
    excerpt_en: str | None = Form(None),
    excerpt_tr: str | None = Form(None),
    body_ru: str = Form(...),
    body_tj: str = Form(...),
    body_en: str = Form(...),
    body_tr: str = Form(...),
    cover: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cover_path = _save_image(cover)
    slug = _unique_slug(db, _slugify(title_ru))

    article = NewsArticle(
        slug=slug,
        cover_path=cover_path,
        published_at=published_at,
        title_ru=title_ru,
        title_tj=title_tj,
        title_en=title_en,
        title_tr=title_tr,
        excerpt_ru=excerpt_ru or None,
        excerpt_tj=excerpt_tj or None,
        excerpt_en=excerpt_en or None,
        excerpt_tr=excerpt_tr or None,
        body_ru=body_ru,
        body_tj=body_tj,
        body_en=body_en,
        body_tr=body_tr,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.patch("/{article_id}", response_model=NewsArticleOut)
async def update_news_article(
    article_id: int,
    published_at: date | None = Form(None),
    title_ru: str | None = Form(None),
    title_tj: str | None = Form(None),
    title_en: str | None = Form(None),
    title_tr: str | None = Form(None),
    excerpt_ru: str | None = Form(None),
    excerpt_tj: str | None = Form(None),
    excerpt_en: str | None = Form(None),
    excerpt_tr: str | None = Form(None),
    body_ru: str | None = Form(None),
    body_tj: str | None = Form(None),
    body_en: str | None = Form(None),
    body_tr: str | None = Form(None),
    cover: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(NewsArticle).filter(NewsArticle.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новость не найдена — возможно, её уже удалили",
        )

    if published_at is not None:
        article.published_at = published_at
    if title_ru is not None:
        article.title_ru = title_ru
    if title_tj is not None:
        article.title_tj = title_tj
    if title_en is not None:
        article.title_en = title_en
    if title_tr is not None:
        article.title_tr = title_tr
    # Blank clears the excerpt on purpose — it is an optional field, and the
    # admin form's own "empty means auto" copy would be a lie otherwise.
    if excerpt_ru is not None:
        article.excerpt_ru = excerpt_ru or None
    if excerpt_tj is not None:
        article.excerpt_tj = excerpt_tj or None
    if excerpt_en is not None:
        article.excerpt_en = excerpt_en or None
    if excerpt_tr is not None:
        article.excerpt_tr = excerpt_tr or None
    if body_ru is not None:
        article.body_ru = body_ru
    if body_tj is not None:
        article.body_tj = body_tj
    if body_en is not None:
        article.body_en = body_en
    if body_tr is not None:
        article.body_tr = body_tr
    # A form submitted without a new file still sends a `cover` part. A plain
    # HTML form leaves it with an empty filename; going through a Next.js
    # server action (as the admin form does) instead turns it into a
    # zero-byte file literally named "undefined" — either way it means "keep
    # the current cover", not "replace it with nothing", so `size` is the
    # reliable signal, not `filename`.
    if cover is not None and cover.size:
        old_cover_path = article.cover_path
        article.cover_path = _save_image(cover)
        _delete_image(old_cover_path)

    db.commit()
    db.refresh(article)
    return article


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_news_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    article = db.query(NewsArticle).filter(NewsArticle.id == article_id).first()
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новость не найдена — возможно, её уже удалили",
        )

    _delete_image(article.cover_path)
    db.delete(article)
    db.commit()
