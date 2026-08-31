from datetime import datetime

from pydantic import BaseModel, Field


class LeadCreate(BaseModel):
    """The site's one request form — calculator, quote, or dealer signup."""

    scenario: str
    name: str = Field(min_length=1)
    phone: str = Field(min_length=1)
    city: str
    product_type: str
    comment: str | None = None
    # The calculator's read-out, already rendered as plain text in the
    # visitor's locale. Free text on purpose — see `Lead` in the frontend's
    # `types/index.ts` for why a structured payload would be premature.
    configuration: str | None = None


class QuickLeadCreate(BaseModel):
    """The short "Свяжитесь с нами" form — a phone number and little else."""

    phone: str = Field(min_length=1)
    name: str | None = None
    interests: list[str] | None = None
    context: str | None = None
    message: str | None = None


class LeadOut(BaseModel):
    id: int
    kind: str
    name: str | None
    phone: str
    scenario: str | None
    city: str | None
    product_type: str | None
    comment: str | None
    configuration: str | None
    interests: list[str] | None
    context: str | None
    message: str | None
    is_reviewed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LeadReviewUpdate(BaseModel):
    is_reviewed: bool
