from pydantic import BaseModel


class AboutContentOut(BaseModel):
    id: int

    hero_title_ru: str
    hero_title_tj: str
    hero_title_en: str
    hero_title_tr: str
    hero_description_ru: str
    hero_description_tj: str
    hero_description_en: str
    hero_description_tr: str

    home_title_ru: str
    home_title_tj: str
    home_title_en: str
    home_title_tr: str
    home_description_ru: str
    home_description_tj: str
    home_description_en: str
    home_description_tr: str

    story_title_ru: str
    story_title_tj: str
    story_title_en: str
    story_title_tr: str
    story_paragraphs_ru: str
    story_paragraphs_tj: str
    story_paragraphs_en: str
    story_paragraphs_tr: str

    timeline_title_ru: str
    timeline_title_tj: str
    timeline_title_en: str
    timeline_title_tr: str
    timeline_description_ru: str
    timeline_description_tj: str
    timeline_description_en: str
    timeline_description_tr: str

    certificates_title_ru: str
    certificates_title_tj: str
    certificates_title_en: str
    certificates_title_tr: str
    certificates_description_ru: str
    certificates_description_tj: str
    certificates_description_en: str
    certificates_description_tr: str

    clients_title_ru: str
    clients_title_tj: str
    clients_title_en: str
    clients_title_tr: str
    clients_quote_ru: str
    clients_quote_tj: str
    clients_quote_en: str
    clients_quote_tr: str

    stat_years_value: int
    stat_years_suffix: str
    stat_projects_value: int
    stat_projects_suffix: str
    stat_employees_value: int
    stat_employees_suffix: str
    stat_tonnage_value: int
    stat_tonnage_suffix: str

    class Config:
        from_attributes = True


class AboutContentUpdate(BaseModel):
    """
    Every field optional — a `PATCH` sends only what changed, same partial-
    update convention as `PATCH /api/showrooms/{id}` (there via `Form(None)`
    per field; here via a JSON body instead, since there's no file upload to
    fight multipart for).
    """

    hero_title_ru: str | None = None
    hero_title_tj: str | None = None
    hero_title_en: str | None = None
    hero_title_tr: str | None = None
    hero_description_ru: str | None = None
    hero_description_tj: str | None = None
    hero_description_en: str | None = None
    hero_description_tr: str | None = None

    home_title_ru: str | None = None
    home_title_tj: str | None = None
    home_title_en: str | None = None
    home_title_tr: str | None = None
    home_description_ru: str | None = None
    home_description_tj: str | None = None
    home_description_en: str | None = None
    home_description_tr: str | None = None

    story_title_ru: str | None = None
    story_title_tj: str | None = None
    story_title_en: str | None = None
    story_title_tr: str | None = None
    story_paragraphs_ru: str | None = None
    story_paragraphs_tj: str | None = None
    story_paragraphs_en: str | None = None
    story_paragraphs_tr: str | None = None

    timeline_title_ru: str | None = None
    timeline_title_tj: str | None = None
    timeline_title_en: str | None = None
    timeline_title_tr: str | None = None
    timeline_description_ru: str | None = None
    timeline_description_tj: str | None = None
    timeline_description_en: str | None = None
    timeline_description_tr: str | None = None

    certificates_title_ru: str | None = None
    certificates_title_tj: str | None = None
    certificates_title_en: str | None = None
    certificates_title_tr: str | None = None
    certificates_description_ru: str | None = None
    certificates_description_tj: str | None = None
    certificates_description_en: str | None = None
    certificates_description_tr: str | None = None

    clients_title_ru: str | None = None
    clients_title_tj: str | None = None
    clients_title_en: str | None = None
    clients_title_tr: str | None = None
    clients_quote_ru: str | None = None
    clients_quote_tj: str | None = None
    clients_quote_en: str | None = None
    clients_quote_tr: str | None = None

    stat_years_value: int | None = None
    stat_years_suffix: str | None = None
    stat_projects_value: int | None = None
    stat_projects_suffix: str | None = None
    stat_employees_value: int | None = None
    stat_employees_suffix: str | None = None
    stat_tonnage_value: int | None = None
    stat_tonnage_suffix: str | None = None
