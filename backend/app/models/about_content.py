from sqlalchemy import Column, DateTime, Integer, String, Text
from datetime import datetime
from app.database import Base


class AboutContent(Base):
    """
    Singleton — the one row (id=1) that holds every piece of freeform text on
    `/about` that isn't a reorderable list (those are `AboutTimelineItem` and
    `AboutCertificate`) or shared brand marks (`Partner`). Also backs the
    stats block, which `/` reads too — see `stat_*` below.

    `story_paragraphs_*` is `Text`, not four separate columns: the story is a
    variable number of paragraphs, joined with `\n\n` here and split back
    into an array at read time (`lib/about.ts`), the same way a Tiptap body
    is one blob rather than one column per paragraph.

    `stat_*_value`/`stat_*_suffix` are locale-*independent* (numbers, not
    prose) — the labels that go with them ("лет на рынке" etc.) are stable
    structural copy and stay in `messages/*.json` under `production.stats.*`,
    deliberately not duplicated here.
    """

    __tablename__ = "about_content"

    id = Column(Integer, primary_key=True, index=True)

    hero_title_ru = Column(String, nullable=False)
    hero_title_tj = Column(String, nullable=False)
    hero_title_en = Column(String, nullable=False)
    hero_title_tr = Column(String, nullable=False)
    hero_description_ru = Column(String, nullable=False)
    hero_description_tj = Column(String, nullable=False)
    hero_description_en = Column(String, nullable=False)
    hero_description_tr = Column(String, nullable=False)

    story_title_ru = Column(String, nullable=False)
    story_title_tj = Column(String, nullable=False)
    story_title_en = Column(String, nullable=False)
    story_title_tr = Column(String, nullable=False)
    story_paragraphs_ru = Column(Text, nullable=False)
    story_paragraphs_tj = Column(Text, nullable=False)
    story_paragraphs_en = Column(Text, nullable=False)
    story_paragraphs_tr = Column(Text, nullable=False)

    timeline_title_ru = Column(String, nullable=False)
    timeline_title_tj = Column(String, nullable=False)
    timeline_title_en = Column(String, nullable=False)
    timeline_title_tr = Column(String, nullable=False)
    timeline_description_ru = Column(String, nullable=False)
    timeline_description_tj = Column(String, nullable=False)
    timeline_description_en = Column(String, nullable=False)
    timeline_description_tr = Column(String, nullable=False)

    certificates_title_ru = Column(String, nullable=False)
    certificates_title_tj = Column(String, nullable=False)
    certificates_title_en = Column(String, nullable=False)
    certificates_title_tr = Column(String, nullable=False)
    certificates_description_ru = Column(String, nullable=False)
    certificates_description_tj = Column(String, nullable=False)
    certificates_description_en = Column(String, nullable=False)
    certificates_description_tr = Column(String, nullable=False)

    clients_title_ru = Column(String, nullable=False)
    clients_title_tj = Column(String, nullable=False)
    clients_title_en = Column(String, nullable=False)
    clients_title_tr = Column(String, nullable=False)
    clients_quote_ru = Column(String, nullable=False)
    clients_quote_tj = Column(String, nullable=False)
    clients_quote_en = Column(String, nullable=False)
    clients_quote_tr = Column(String, nullable=False)

    stat_years_value = Column(Integer, nullable=False)
    stat_years_suffix = Column(String, nullable=False)
    stat_projects_value = Column(Integer, nullable=False)
    stat_projects_suffix = Column(String, nullable=False)
    stat_employees_value = Column(Integer, nullable=False)
    stat_employees_suffix = Column(String, nullable=False)
    stat_tonnage_value = Column(Integer, nullable=False)
    stat_tonnage_suffix = Column(String, nullable=False)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<AboutContent(id={self.id})>"
