from pydantic import BaseModel


class AboutCertificateOut(BaseModel):
    id: int
    title_ru: str
    title_tj: str
    title_en: str
    title_tr: str
    image_path: str
    position: int

    class Config:
        from_attributes = True


class AboutCertificateReorderRequest(BaseModel):
    """Ordered list of every certificate's id, front to back."""

    ordered_ids: list[int]
