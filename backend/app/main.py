import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import auth_router, users_router
from app.startup import seed_initial_admin

# Ensures `app.startup`'s seed log line is visible under `docker compose logs`
# regardless of whether `database.py`'s `echo=True` (which incidentally also
# triggers a logging config) stays as-is.
logging.basicConfig(level=logging.INFO)

# Создание таблиц
Base.metadata.create_all(bind=engine)
seed_initial_admin()

app = FastAPI(
    title="FastAPI Auth Service",
    description="API с авторизацией на FastAPI + PostgreSQL",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Включение маршрутов
app.include_router(auth_router)
app.include_router(users_router)

@app.get("/")
async def root():
    return {"message": "FastAPI Auth Service"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)