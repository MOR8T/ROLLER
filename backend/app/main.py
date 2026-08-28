import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import (
    auth_router,
    users_router,
    hero_slides_router,
    partners_router,
    news_router,
    product_categories_router,
    showrooms_router,
    about_content_router,
    about_timeline_router,
    about_certificates_router,
    contact_info_router,
    contact_interests_router,
)
from app.config import get_settings
from app.startup import (
    seed_initial_admin,
    seed_about_content,
    seed_about_timeline,
    seed_about_certificates,
    seed_contact_info,
    seed_contact_interests,
)

# The only logging configuration in the app. It used to be belt-and-braces —
# `database.py`'s `echo=True` configured logging as a side effect — but that
# is off by default now, so `app.startup`'s seed lines reach
# `docker compose logs` only because of this call.
logging.basicConfig(level=logging.INFO)

# Схема живёт в Alembic (`migrations/`), а не в `create_all` — таблицы уже
# применены entrypoint'ом контейнера к моменту импорта этого модуля.
seed_initial_admin()
seed_about_content()
seed_about_timeline()
seed_about_certificates()
seed_contact_info()
seed_contact_interests()

app = FastAPI(
    title="FastAPI Auth Service",
    description="API с авторизацией на FastAPI + PostgreSQL",
    version="1.0.0"
)

# CORS. The old `allow_origins=["*"]` paired with `allow_credentials=True`
# was never actually honoured — browsers reject that combination outright.
# Behind the production nginx everything is same-origin, so this list is empty
# there and the middleware becomes a no-op; ALLOWED_ORIGINS exists for a
# frontend hosted somewhere else.
_allowed_origins = [
    origin.strip()
    for origin in get_settings().allowed_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Загруженные файлы (изображения слайдов и т.д.) — путь совпадает с
# `UPLOAD_DIR` в app/routes/hero_slides.py, которая уже создаёт директорию.
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Включение маршрутов
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(hero_slides_router)
app.include_router(partners_router)
app.include_router(news_router)
app.include_router(product_categories_router)
app.include_router(showrooms_router)
app.include_router(about_content_router)
app.include_router(about_timeline_router)
app.include_router(about_certificates_router)
app.include_router(contact_info_router)
app.include_router(contact_interests_router)

@app.get("/")
async def root():
    return {"message": "FastAPI Auth Service"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
