from pydantic import BaseModel


class ContactInterestOut(BaseModel):
    id: int
    label_ru: str
    label_tj: str
    label_en: str
    label_tr: str
    position: int

    class Config:
        from_attributes = True


class ContactInterestReorderRequest(BaseModel):
    """Ordered list of every interest's id, front to back."""

    ordered_ids: list[int]
