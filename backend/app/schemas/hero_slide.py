from pydantic import BaseModel


class HeroSlideOut(BaseModel):
    id: int
    title_ru: str
    title_tj: str
    title_en: str
    title_tr: str
    image_path: str
    product_link: str
    position: int

    class Config:
        from_attributes = True


class HeroSlideReorderRequest(BaseModel):
    """Ordered list of every slide's id, front to back."""

    ordered_ids: list[int]
