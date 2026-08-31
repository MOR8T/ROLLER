from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_hours: int = 8

    # Echoes every SQL statement to stdout. Debugging aid only: leave it off
    # in production, where Docker caps container logs at 10 MB x 3 files and
    # this volume of noise evicts real errors within minutes.
    sql_echo: bool = False

    # Comma-separated origins allowed to call this API cross-origin.
    # In production nginx serves the site, /api and /uploads off one host,
    # so the browser never makes a cross-origin request and this can stay
    # empty. It exists for the case of a separately hosted frontend.
    allowed_origins: str = ""

    # Optional — only used by `app.startup.seed_initial_admin` to create the
    # first admin user on a fresh database (there is no `/register` endpoint).
    # Seeding is skipped unless all three are set.
    initial_admin_username: str | None = None
    initial_admin_email: str | None = None
    initial_admin_password: str | None = None

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()