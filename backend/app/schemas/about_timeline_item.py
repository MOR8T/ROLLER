from pydantic import BaseModel


class AboutTimelineItemOut(BaseModel):
    id: int
    year_ru: str
    year_tj: str
    year_en: str
    year_tr: str
    title_ru: str
    title_tj: str
    title_en: str
    title_tr: str
    description_ru: str
    description_tj: str
    description_en: str
    description_tr: str
    position: int

    class Config:
        from_attributes = True


class AboutTimelineItemReorderRequest(BaseModel):
    """Ordered list of every timeline item's id, front to back."""

    ordered_ids: list[int]
