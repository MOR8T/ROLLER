from pydantic import BaseModel


class ContactInfoOut(BaseModel):
    id: int

    address_ru: str
    address_tj: str
    address_en: str
    address_tr: str
    map_url: str

    phone: str
    email: str
    whatsapp: str

    class Config:
        from_attributes = True


class ContactInfoUpdate(BaseModel):
    """Every field optional — a `PATCH` sends only what changed, same
    partial-update convention as `AboutContentUpdate`."""

    address_ru: str | None = None
    address_tj: str | None = None
    address_en: str | None = None
    address_tr: str | None = None
    map_url: str | None = None

    phone: str | None = None
    email: str | None = None
    whatsapp: str | None = None
