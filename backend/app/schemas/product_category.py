from pydantic import BaseModel


class ProductCategoryOut(BaseModel):
    id: int
    name_ru: str
    name_tj: str
    name_en: str
    name_tr: str
    image_path: str
    position: int

    class Config:
        from_attributes = True


class ProductCategoryReorderRequest(BaseModel):
    """Ordered list of every category's id, front to back."""

    ordered_ids: list[int]
