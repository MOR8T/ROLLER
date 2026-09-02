from pydantic import BaseModel


class SiteSettingsOut(BaseModel):
    maintenance_mode: bool

    class Config:
        from_attributes = True


class SiteSettingsUpdate(BaseModel):
    """
    A full replace of the one switch there is. Deliberately not
    `exclude_unset`-style partial like `ContactInfoUpdate`: with a single
    boolean, "field absent" and "field false" would be indistinguishable to
    anyone reading the call site, and the admin toggle always knows the value
    it wants.
    """

    maintenance_mode: bool
