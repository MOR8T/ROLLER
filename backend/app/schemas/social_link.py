from typing import Literal

from pydantic import BaseModel

# The fixed set of networks an admin can pick from. The frontend's
# `lib/social-networks.ts` lists these exact same keys — it is how a
# `SocialLink` row gets mapped to a brand icon without the backend knowing
# anything about icons. Adding a network means updating both sides.
SocialNetwork = Literal["instagram", "telegram", "facebook", "youtube", "tiktok"]


class SocialLinkOut(BaseModel):
    id: int
    network: str
    url: str
    enabled: bool
    position: int

    class Config:
        from_attributes = True


class SocialLinkCreate(BaseModel):
    network: SocialNetwork
    url: str
    enabled: bool = True


class SocialLinkUpdate(BaseModel):
    """Every field optional — same partial-update convention as `ContactInfoUpdate`."""

    network: SocialNetwork | None = None
    url: str | None = None
    enabled: bool | None = None


class SocialLinkReorderRequest(BaseModel):
    """Ordered list of every social link's id, front to back."""

    ordered_ids: list[int]
