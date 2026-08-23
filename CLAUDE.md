# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ROLLER.TJ — corporate site and product catalog for a PVC/aluminium profile-systems
manufacturer in Tajikistan. Two independent apps, no root-level tooling tying them
together:

- `frontend/` — Next.js 16 site. Fully built: homepage, catalog, product pages,
  calculator, news, showroom, contacts, about, all in four locales.
- `backend/` — FastAPI + PostgreSQL service. Freshly scaffolded (single commit) and
  currently **auth-only** (register/login/me) — nothing else exists yet, and the
  frontend does not call it. `lib/leads.ts` and `lib/news.ts` in the frontend are
  written as stubs specifically so this API can be swapped in later without touching
  callers; see those files' module comments for the intended contract.

`notes/` (gitignored) holds raw source photography and per-brand material handed
over by the client — reference only, not part of the app.

There used to be a `CLAUDE.md`/`AGENTS.md`/`DESIGN.md`/`project_plan/` set of docs;
they were deleted deliberately as each build stage finished (they are gone from
`git log`, not just from disk). Inline comments across `data/*.ts`, `types/index.ts`
and the `i18n/` files still narrate decisions in terms of those documents — treat
those references as historical rationale for *why* a shape looks the way it does,
not as pointers to files that still exist.

## Commands

**Frontend** (run from `frontend/`):
```sh
npm run dev          # dev server on port 3031 (not the Next.js default 3000)
npm run build
npm run lint          # ESLint
npm run format        # Prettier --write
npm run format:check
```
No test framework is configured.

**Backend** (run from `backend/`, with its own `venv/` activated):
```sh
uvicorn app.main:app --reload
```
No test framework is configured. `backend/.env` (see `.env.example`) must supply
`DATABASE_URL` and `SECRET_KEY` before the app can start — `app/config.py` reads
them via `pydantic_settings.BaseSettings`, which is **not currently listed in
`requirements.txt`** and is not installed in `backend/venv/`; installing it is a
prerequisite for running the backend at all.

There are two unrelated Python virtualenvs in this repo: `backend/venv/` for the
FastAPI app, and a root `venv/` used for the `graphify` CLI. Don't mix them up.

## Next.js 16 warning

This project is on Next.js 16, which has real breaking changes from older
conventions. Before writing or changing Next.js code (routing, data fetching,
`params`/`searchParams` typing, metadata, fonts), check
`frontend/node_modules/next/dist/docs/` rather than assuming APIs match training
data — e.g. `LayoutProps<"/[locale]">` / `PageProps<"...">` generated route-prop
types are already in use in this codebase (`app/[locale]/layout.tsx`).

## Graphify knowledge graph

A graph of this repo lives at `graphify-out/` and the `graphify` CLI is on PATH.
Prefer it over blind grepping for cross-file questions:
- `graphify query "<question>"` — scoped subgraph for a question
- `graphify path "<A>" "<B>"` — dependency path between two symbols
- `graphify explain "<concept>"` — nodes related to a concept
- `graphify update .` after modifying code, to keep the graph current (AST-only, no API cost)

`graphify-out/GRAPH_REPORT.md` has a standing architecture summary; check the
"Graph Freshness" commit hash against `git rev-parse HEAD` before trusting it.

## Frontend architecture

### i18n
Four locales — `ru` (default), `tg`, `en`, `tr` — via `next-intl`, always
URL-prefixed (`i18n/routing.ts`). Slugs (product/category names, article slugs)
are Latin and identical across locales; there is no `pathnames` map.

**Every internal link must go through `@/i18n/navigation`'s `Link`/`redirect`/
`useRouter`, never plain `next/link`** — the latter drops the current locale.
Plain `<a>` is only for genuinely external targets (`wa.me`, `tel:`, `mailto:`)
and same-page fragments; `lib/utils.ts`'s `isExternalHref()` is the test used to
decide which a given `href` needs.

A missing translation key renders as an **empty string**, not the key name and
not a fallback to Russian (`i18n/request.ts`) — by design, so a gap is visible in
the UI rather than silently leaking another language.

### Data layer: `data/` + `messages/*.json`
The general pattern, used by `data/products.ts`, `data/home.ts`, `data/calculator.ts`,
etc.: **locale-independent structure** (slugs, links, numbers, enum-like keys)
lives in `data/*.ts`; **all display text** lives in `messages/{ru,tg,en,tr}.json`
under a matching namespace, looked up by slug/key at render time. Never hardcode a
label in `data/`; never put a slug or a number in the message catalogues.
`types/index.ts` documents each interface's split between the two, field by field —
read it before adding to either side. It's written as the contract a future backend
JSON/JSONB API would have to satisfy, so text fields there are typed as plain
`string` even though today's data comes from `messages/`.

One deliberate exception: `lib/localized-messages.ts` reads **all four**
catalogues into one `{ru, tg, en, tr}` object per string (`LocalizedText`, defined
in `lib/localized.ts`) for the product page, which was built to carry copy as data
rather than ask `next-intl` per-request. `lib/localized-messages.ts` is
**server-only** — importing it from a client component ships all four catalogues
(~1200 lines combined) to the browser. Everywhere else, use `useTranslations`
normally.

### Calculator
`data/calculator-schemes.json` (parsed geometry) + `data/calculator.ts` (option
lists: constructions, materials, glazing, lamination colors, size ranges) drive
`components/calculator/*`. It is explicitly not a price calculator — no field here
may be used to compute or display a price.

### News
`lib/news.ts` is the sole read path for news (`data/news/<locale>.json` today).
Nothing else may import those JSON files directly — components take `NewsArticle`
props, pages call `lib/news.ts`'s functions. Note `NewsArticle.body` (string[] of
paragraphs) intentionally diverges from `Article.body` (single string) in
`types/index.ts`; the JSON-backed version is the one actually rendered.

### Leads
`lib/leads.ts` is a stub for lead submission (calculator requests, quote requests,
dealer signup, quick contact forms). The order of operations it encodes — **store
first, send to WhatsApp second** — is intentional and must be preserved when this
is wired to a real endpoint: submitting to WhatsApp first risks losing a lead if
the visitor never presses send in the WhatsApp UI.

### Design tokens
Brand colors, radii, container width, spacing scale, and hero height are Tailwind
v4 `@theme` custom properties in `app/globals.css`. Fonts are Chakra Petch
(headings/brand) and Montserrat (body/Cyrillic), loaded via `next/font/google` in
`app/[locale]/layout.tsx` — see that file's comments before touching font subsets
or weights, the preload budget is tuned per current usage.

### Path alias
`@/*` maps to the `frontend/` root (`tsconfig.json`).

## Backend architecture

Standard FastAPI layering: `routes/` → `schemas/` (Pydantic) → `models/` (SQLAlchemy)
→ `database.py` (session/engine), with `dependencies/auth.py` providing
`get_current_user` via a bearer JWT (`utils/security.py`, `python-jose` + `passlib`
bcrypt). `main.py` currently allows CORS from `*` — fine for local dev, must be
scoped before any deployment. `Base.metadata.create_all` runs at import time in
`main.py` (no migration tool like Alembic is set up); adding models means the
tables appear automatically on next backend start, not via a migration.
