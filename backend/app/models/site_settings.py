from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, String

from app.database import Base


class SiteSettings(Base):
    """
    Singleton (row id=1) for site-wide switches an admin flips from
    «Настройки сайта» — same shape as `ContactInfo`/`CalculatorSettings`.

    `maintenance_mode` closes the *public* site: when it is true
    `app/[locale]/layout.tsx` renders the "САЙТ В РАЗРАБОТКЕ" screen instead
    of the header/page/footer, on all four locales. It
    deliberately does not touch `/admin`, `/login` or `/api` — the admin has
    to stay able to log in and turn it back off, and the client's own
    maintenance banner (roller.tj, 2026-09) is exactly this: a placeholder
    over the storefront, not a shut-down service.

    `preview_code` is the one door through that screen — see the column.

    Kept as its own table rather than a column on `ContactInfo` because the
    two are edited from different admin pages and mean different things; the
    next site-wide switch belongs here too, not on a contact record.
    """

    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)

    maintenance_mode = Column(Boolean, nullable=False, default=False)

    # The code that lets a person through the maintenance screen — the client,
    # a contractor, anyone who has to see the real site while it is closed.
    # Entered on the placeholder itself (`components/layout/maintenance-screen.tsx`),
    # checked by `POST /api/site-settings/preview-access`.
    #
    # ⚠️ Stored in the clear, unlike `User.hashed_password`, and that is the
    # point rather than an oversight: this is a shared door code an admin has
    # to be able to *read back* in «Настройки сайта» and pass on over the
    # phone, not a per-person credential. It grants exactly one thing — sight
    # of a site that is public anyway a week later — and it is never accepted
    # by `/admin`, `/login` or any write route. Treat it accordingly: it must
    # never be returned by the public GET below, only compared against.
    #
    # NULL (or empty) means no code is configured, which is the shipped state:
    # the placeholder then has nothing to unlock and stays inert.
    preview_code = Column(String(64), nullable=True)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def preview_access_enabled(self) -> bool:
        """
        Whether a preview code exists — the one thing about it the public API
        may say. The placeholder needs it to decide whether the logo plate is
        a button at all; offering a prompt that no code can ever satisfy is
        worse than offering none.
        """
        return bool(self.preview_code and self.preview_code.strip())

    def __repr__(self):
        return f"<SiteSettings(id={self.id}, maintenance_mode={self.maintenance_mode})>"
