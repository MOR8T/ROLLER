from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer

from app.database import Base


class SiteSettings(Base):
    """
    Singleton (row id=1) for site-wide switches an admin flips from
    «Настройки сайта» — same shape as `ContactInfo`/`CalculatorSettings`.

    Today it holds one field. `maintenance_mode` closes the *public* site:
    when it is true `app/[locale]/layout.tsx` renders the "САЙТ В РАЗРАБОТКЕ"
    screen instead of the header/page/footer, on all four locales. It
    deliberately does not touch `/admin`, `/login` or `/api` — the admin has
    to stay able to log in and turn it back off, and the client's own
    maintenance banner (roller.tj, 2026-09) is exactly this: a placeholder
    over the storefront, not a shut-down service.

    Kept as its own table rather than a column on `ContactInfo` because the
    two are edited from different admin pages and mean different things; the
    next site-wide switch belongs here too, not on a contact record.
    """

    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)

    maintenance_mode = Column(Boolean, nullable=False, default=False)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<SiteSettings(id={self.id}, maintenance_mode={self.maintenance_mode})>"
