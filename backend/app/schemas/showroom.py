from pydantic import BaseModel


class ShowroomOut(BaseModel):
    id: int
    city_ru: str
    city_tj: str
    city_en: str
    city_tr: str
    address_ru: str
    address_tj: str
    address_en: str
    address_tr: str
    hours_ru: str
    hours_tj: str
    hours_en: str
    hours_tr: str
    phone: str
    lat: float
    lng: float
    route_url: str
    photo_path: str
    position: int

    class Config:
        from_attributes = True


class ShowroomReorderRequest(BaseModel):
    """Ordered list of every showroom's id, front to back."""

    ordered_ids: list[int]
