from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import get_settings

settings = get_settings()

# ⚠️ The pool is sized against Starlette's threadpool, not against expected
# traffic.
#
# Every route here is an `async def` that talks to SQLAlchemy synchronously,
# and `get_db` is a *sync* generator — so FastAPI runs the dependency in the
# default threadpool, which is 40 threads wide. Up to 40 sessions can therefore
# be checked out at once, while SQLAlchemy's defaults allow 5 + 10. Anything
# that fans out — a `next build` generating 130 pages across 9 workers, each
# page's layout asking for the header menu — exhausts the pool and every
# further request fails with `QueuePool limit … reached` after a 30s wait,
# which reads as the backend hanging.
#
# 20 + 40 covers the threadpool with room to spare and stays well inside
# Postgres' default `max_connections` of 100 for the single uvicorn process
# this app runs as.
engine = create_engine(
    settings.database_url,
    pool_size=20,
    max_overflow=40,
    # Off by default; set SQL_ECHO=true in the environment to debug queries.
    echo=settings.sql_echo,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()