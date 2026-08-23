from pydantic import BaseModel


class PartnerOut(BaseModel):
    id: int
    name: str
    logo_path: str
    position: int

    class Config:
        from_attributes = True


class PartnerReorderRequest(BaseModel):
    """Ordered list of every partner's id, front to back."""

    ordered_ids: list[int]
