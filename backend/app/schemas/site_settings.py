from pydantic import BaseModel, field_validator


class SiteSettingsOut(BaseModel):
    """
    The public view of the row, served to the storefront's root layout on
    every render.

    ⚠️ `preview_code` is deliberately absent and must stay absent: this
    response is unauthenticated, so any field added here is a field anyone can
    read. `preview_access_enabled` (a model property) says only *whether* a
    code exists, which is what the placeholder needs to know to decide if its
    logo plate is a button.
    """

    maintenance_mode: bool
    preview_access_enabled: bool

    class Config:
        from_attributes = True


class SiteSettingsAdminOut(SiteSettingsOut):
    """The same row as «Настройки сайта» sees it — behind `get_current_user`,
    and the only response that carries the code itself, because an admin has
    to be able to read back the code they are handing out."""

    preview_code: str | None


class SiteSettingsUpdate(BaseModel):
    """
    A full replace of the maintenance switch. Deliberately not
    `exclude_unset`-style partial like `ContactInfoUpdate`: with a single
    boolean, "field absent" and "field false" would be indistinguishable to
    anyone reading the call site, and the admin toggle always knows the value
    it wants.

    The preview code is *not* here. It is a text field saved from its own form
    on the same page, while this is a toggle that saves the moment it is
    flipped — folding them together would mean either the toggle writing back
    a half-typed code or the code form being able to close the site.
    """

    maintenance_mode: bool


class PreviewCodeUpdate(BaseModel):
    """`null`, `""` or blank all mean the same thing — no code, the plate on
    the placeholder goes inert — so they are normalised to `None` here rather
    than at three call sites."""

    preview_code: str | None = None

    @field_validator("preview_code")
    @classmethod
    def _blank_is_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class PreviewAccessRequest(BaseModel):
    code: str


class PreviewAccessResult(BaseModel):
    """Just the verdict. No hint about *why* a code was rejected, and no echo
    of what was sent — the caller is anonymous."""

    valid: bool
