# ROLLER.TJ

Корпоративный сайт и каталог продукции производителя ПВХ/алюминиевых
профильных систем (Таджикистан). Состоит из двух независимых приложений:

- **`frontend/`** — сайт на Next.js 16: главная, каталог, карточки товаров,
  калькулятор, новости, шоурум, контакты, «о компании» — на четырёх языках
  (ru, tg, en, tr). Плюс закрытая админ-панель (`/login`, `/admin`).
- **`backend/`** — API на FastAPI + PostgreSQL. На данный момент отвечает
  только за авторизацию админ-панели (JWT-логин, `/api/users/me`).

## Стек

| | |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4, next-intl |
| Backend | FastAPI, SQLAlchemy, PostgreSQL, JWT (python-jose), bcrypt |
| Инфраструктура | Docker / Docker Compose |

## Структура репозитория

```
.
├── frontend/          # Next.js-приложение (порт 3031)
├── backend/           # FastAPI-приложение (порт 8000)
├── docker-compose.yml           # prod-подобный запуск (db + backend + frontend)
├── docker-compose.override.yml  # dev-оверрайд (hot-reload, bind-mount исходников)
├── .env.example       # шаблон переменных для docker compose
└── CLAUDE.md           # подробности архитектуры (для контекста разработки)
```

---

## Быстрый запуск через Docker (рекомендуется)

Нужен только установленный Docker + Docker Compose. Поднимает разом
PostgreSQL, бэкенд и фронтенд.

```bash
cp .env.example .env
# при желании отредактировать .env — пароли БД, SECRET_KEY, логин/пароль
# первого админа, ключ Яндекс.Карт
```

**Режим разработки** (hot-reload и на фронте, и на бэке — применяется
автоматически, `docker-compose.override.yml` подхватывается сам):

```bash
docker compose up
```

**Прод-подобный запуск** (Next.js собран в standalone-режиме, без
bind-mount'ов, `uvicorn` без `--reload`):

```bash
docker compose -f docker-compose.yml up -d --build
```

После старта:
- сайт — http://localhost:3031
- админка — http://localhost:3031/login
- API — доступен изнутри docker-сети как `http://backend:8000`; в dev-режиме
  дополнительно проброшен наружу на http://localhost:8000

Первый администратор создаётся автоматически при первом старте бэкенда — из
переменных `INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_EMAIL` /
`INITIAL_ADMIN_PASSWORD` в `.env` (публичной регистрации в API нет
намеренно). Смена этих переменных на уже поднятой базе ничего не создаст
повторно — сидинг идемпотентен.

> ⚠️ `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` вшивается в JS-бандл на этапе сборки
> прод-образа. Если поменяли его в `.env` — одного `docker compose up`
> недостаточно, нужно пересобрать: `docker compose build frontend`.

### Полезные команды Docker Compose

```bash
docker compose logs -f backend      # логи бэкенда (включая сидинг админа)
docker compose exec backend sh      # зайти в контейнер бэкенда
docker compose down                 # остановить, БД сохраняется (volume)
docker compose down -v              # остановить и удалить данные БД
```

---

## Запуск без Docker (локальная разработка)

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:3031
```

Другие команды:

```bash
npm run build          # прод-сборка
npm run lint            # ESLint
npm run format          # Prettier --write
npm run format:check
```

Тестового фреймворка в проекте нет.

### Backend

Требуется отдельно поднятый PostgreSQL. Пример создания роли и базы:

```bash
psql -U <ваш_superuser> -d postgres \
  -c "CREATE ROLE roller_bd WITH LOGIN PASSWORD 'roller_password';" \
  -c "CREATE DATABASE roller_bd OWNER roller_bd;"
```

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# заполнить DATABASE_URL / SECRET_KEY

uvicorn app.main:app --reload   # http://localhost:8000
```

Таблицы создаются автоматически при первом старте (миграций/Alembic в
проекте нет). Первого администратора без Docker проще всего создать, задав
`INITIAL_ADMIN_USERNAME` / `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`
в `backend/.env` перед первым запуском — сидинг сработает так же, как в
Docker.

Фронтенду в этом режиме нужен `frontend/.env.local` с:

```
BACKEND_API_URL=http://127.0.0.1:8000
```

---

## Переменные окружения

### Корневой `.env` (для `docker compose`)

| Переменная | Назначение |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | учётные данные БД |
| `SECRET_KEY` | ключ подписи JWT |
| `ALGORITHM` | алгоритм JWT (по умолчанию `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | время жизни токена |
| `INITIAL_ADMIN_USERNAME` / `_EMAIL` / `_PASSWORD` | данные первого админа, создаётся при старте бэкенда |
| `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` | ключ Яндекс.Карт для блока с картой на сайте (вшивается в сборку) |

### `backend/.env` (только для запуска `uvicorn` напрямую на хосте)

`DATABASE_URL`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`,
опционально `INITIAL_ADMIN_*`. Не связан с корневым `.env` — в Docker
используется отдельный набор переменных, собираемый в `docker-compose.yml`.

### `frontend/.env.local` (только для запуска `npm run dev` напрямую на хосте)

`BACKEND_API_URL` — адрес бэкенда.

---

## Локализация

Четыре локали — `ru` (по умолчанию), `tg`, `en`, `tr`, всегда с префиксом в
URL (`/ru/...`, `/tg/...` и т.д.). Слаги товаров и категорий одинаковые во
всех локалях (латиница).

## Админ-панель

`/login` — форма входа, `/admin` — защищённая страница. Сессия хранится в
httpOnly-cookie, JWT никогда не попадает в клиентский JS. Публичной
регистрации нет — пользователей заводит только сидинг из `INITIAL_ADMIN_*`.
