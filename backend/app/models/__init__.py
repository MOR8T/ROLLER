"""
The single registry of every SQLAlchemy model.

Importing this package is what attaches all tables to `Base.metadata`, which
is what `migrations/env.py` hands to Alembic's autogenerate. A model that is
missing from this list is invisible to migrations — it will not appear in a
generated revision, and its table will simply never be created on a fresh
database. Add new models here.
"""

from app.models.about_certificate import AboutCertificate
from app.models.about_content import AboutContent
from app.models.about_timeline_item import AboutTimelineItem
from app.models.contact_info import ContactInfo
from app.models.contact_interest import ContactInterest
from app.models.hero_slide import HeroSlide
from app.models.news_article import NewsArticle
from app.models.partner import Partner
from app.models.product_category import ProductCategory
from app.models.showroom import Showroom
from app.models.user import User

__all__ = [
    "AboutCertificate",
    "AboutContent",
    "AboutTimelineItem",
    "ContactInfo",
    "ContactInterest",
    "HeroSlide",
    "NewsArticle",
    "Partner",
    "ProductCategory",
    "Showroom",
    "User",
]
