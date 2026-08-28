from sqlalchemy import Boolean, Column, DateTime, Integer, String
from datetime import datetime
from app.database import Base


class SocialLink(Base):
    """
    One entry in the footer's social-icons column. `network` is one of the
    fixed keys in `SOCIAL_NETWORKS` (`app/schemas/social_link.py`) — the
    frontend's `lib/social-networks.ts` must list the exact same keys, since
    that is how it picks a brand icon for a row without the backend knowing
    anything about icons.

    Same reorderable-list shape as `ContactInterest`, and replaces the old
    `ContactInfo.social_instagram_*`/`social_telegram_*` fixed-column pair —
    an admin can now add or remove a network without a code change.
    `enabled` keeps the same purpose the old `social_*_enabled` columns had:
    hide a link from the footer without losing the URL underneath it.
    """

    __tablename__ = "social_links"

    id = Column(Integer, primary_key=True, index=True)
    network = Column(String, nullable=False)
    url = Column(String, nullable=False)
    enabled = Column(Boolean, nullable=False, default=True)
    position = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<SocialLink(id={self.id}, network='{self.network}')>"
