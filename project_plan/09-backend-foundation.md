# Этап 09 — Фундамент бэкенда (FastAPI)

**Фаза:** 2 (Backend) · **Зависит от:** утверждённый фронтенд (этапы 02–08)

## Цель
Инициализировать backend на FastAPI: чистая структура, конфигурация окружения,
подключение к PostgreSQL через SQLAlchemy, готовность к разработке API.

## Предусловия
- Папка `backend/` пуста.
- Контракт данных зафиксирован в моках фронтенда (типы из этапа 04).
- **Открытый вопрос №1 должен быть закрыт до этапа 10** — от него зависит схема.

## Задачи
- [ ] Инициализировать проект (`pyproject.toml`, менеджер — `uv` / `poetry` / `pip`).
- [ ] Зависимости: `fastapi`, `uvicorn[standard]`, `sqlalchemy>=2`, `alembic`,
      `psycopg[binary]`, `pydantic>=2`, `pydantic-settings`, `pyjwt`,
      `passlib[bcrypt]`, `python-multipart`.
- [ ] Структура:
  ```
  backend/app/
  ├── main.py            # создание app, роутеры, CORS
  ├── core/
  │   ├── config.py      # Settings (pydantic-settings, .env)
  │   ├── security.py    # хеш паролей, JWT
  │   └── database.py    # engine, SessionLocal, Base, get_db
  ├── models/            # SQLAlchemy модели (этап 10)
  ├── schemas/           # Pydantic схемы
  ├── crud/              # доступ к данным
  ├── api/
  │   ├── deps.py        # зависимости (сессия, текущий пользователь)
  │   ├── public/        # публичные роутеры (этап 11)
  │   └── admin/         # админ-роутеры (этап 12)
  └── __init__.py
  ```
- [ ] `core/config.py`: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`,
      upload-пути, список локалей. Секреты — только через `.env`,
      в репозиторий не коммитить; сделать `.env.example`.
- [ ] `core/database.py`: движок SQLAlchemy 2.0, `Base`, `get_db`.
- [ ] CORS для домена фронтенда.
- [ ] Health-check `GET /health`.
- [ ] PostgreSQL локально или через `docker-compose`.
- [ ] `README` бэкенда: запуск, миграции, переменные окружения.

## Результат / артефакты
- Запускаемое FastAPI-приложение (`uvicorn app.main:app --reload`).
- Подключение к PostgreSQL, `/health` отвечает 200.
- `.env.example`.

## Критерии готовности
- Сервер стартует без ошибок, `/health` возвращает 200.
- Подключение к БД проверено.

## Заметки
- `.env` и ключи не читать и не коммитить.
- Рекомендация: `docker-compose.yml` с PostgreSQL для единообразия среды
  (пригодится на этапе 14).
