from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

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