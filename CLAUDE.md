# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

ROLLER.TJ — corporate site and product catalog for a PVC/aluminium profile-systems
manufacturer in Tajikistan. Two independent apps, no root-level tooling tying them
together:

- `frontend/` — Next.js 16 site: homepage, product pages, calculator, news,
  showroom, contacts, about, all in four locales, plus the admin panel at
  `/admin` (outside the `[locale]` segment).
- `backend/` — FastAPI + PostgreSQL service behind the admin panel. Auth plus
  hero slides, partners, news, product categories, products and their page
  sections, showrooms, the about page and contacts. `lib/leads.ts` is still the
  one stub left; see its module comment for the intended contract.

⚠️ There is no product *catalogue index*. `/products` was removed on 2026-08-28
at the client's request; the entry points are the category strip on the homepage
and the header's «Продукция» panel, and the addresses are
`/products/<category_id>` and `/products/<category_id>/<product_id>` — database
ids, not slugs.

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

### Products
Products live in the backend and are managed from `/admin/products`
(`lib/products.ts` is the sole read path; nothing else may call `/api/products`).
A product is a photo, a title and a description per locale — that is the card
*and* the page's opening screen — plus an **ordered list of sections**, each one
of four kinds (`finishes`, `specs`, `story`, `gallery`) with a JSONB
payload. The order the admin puts them in is the order the page renders, a kind
may repeat, and `components/products/page/product-page-view.tsx` loops over the
list rather than naming the blocks.

⚠️ `data/products.ts` still exists but is **only** the calculator's source now
(`data/calculator.ts`) and the option list in `components/forms/request-form.tsx`.
The catalogue, the header menu and the product page no longer read it. Its module
comments still describe it as the catalogue — historical, like the `project_plan`
references above.

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

### Maintenance mode
`/admin/settings` → «Сайт в разработке» flips a boolean on the backend's
`site_settings` singleton. When it is on, `app/[locale]/layout.tsx` returns
`MaintenanceScreen` instead of the header/page/footer on all four locales, and
`generateMetadata` swaps in a `noindex` placeholder title. `/admin`, `/login`
and `/api` sit outside `[locale]` and are deliberately untouched — the admin
has to stay able to log in and switch it back off.

`lib/site-settings.ts` **fails open**: an unreachable or slow backend returns
`maintenanceMode: false`, so a backend hiccup can never take the storefront
down on its own. The switch is instant because the action revalidates the
`site-settings` tag; the fetch's 60s `revalidate` is only a backstop.

`MaintenanceScreen` is a rebuild of the placeholder the client ran on roller.tj
in 2026-09 (Tilda + GSAP), down to its palette and timings — the styles are in
`app/globals.css` under "Maintenance screen", the stroke stagger is in the
component because it sorts by `getTotalLength()`. Treat it as a copy of that
page, not as a design to iterate on. Its one addition is the preview door
below.

**Preview code.** `/admin/settings` → «Код доступа к сайту» writes
`site_settings.preview_code`. When one is set, the placeholder's logo plate
becomes a button that opens a code prompt (`maintenance-access-dialog.tsx`,
styled in the same `globals.css` block — *not* `components/ui/modal.tsx`,
which is the light site-design-system dialog). A correct code goes into an
httpOnly **session** cookie — no `maxAge`, so it dies with the browser and the
next visit is prompted again — and `app/[locale]/layout.tsx` renders the real
site for that visitor. Three things are load-bearing:

- the code is **never** in the public `/api/site-settings` payload — that
  response carries only `preview_access_enabled`; the code is compared by
  `POST /api/site-settings/preview-access` and read back only by the
  authenticated `/api/site-settings/admin`;
- `lib/maintenance-access.ts` fails **closed**, the mirror of
  `lib/site-settings.ts`'s fail-open, and re-checks the cookie against the
  backend every render — which is what makes changing the code revoke every
  session at once;
- the `cookies()` read (`readMaintenancePreviewCookie`) is **unconditional**,
  which is what makes every route under `app/[locale]` dynamic (ƒ in
  `next build`). Do not put it back behind `maintenanceMode` to win back
  static rendering — that is the shape that broke the site on 2026-09-05:
  CI builds the image with the switch off and no backend reachable, so the
  pages compiled static; turning the switch on then made each regeneration
  hit `cookies()`, fail with `DYNAMIC_SERVER_USAGE` and fall back to the
  empty HTML baked at build time (and 500 on `/products/*`, which had no
  baked copy). The *verification* POST is still guarded — only the cookie
  read is not. `lib/page-metadata.ts` answers the same switch for the same
  reason: page metadata merges over the layout's, so without it a closed
  site kept publishing real titles and `index, follow`.

It gates *rendering the public site* and nothing else. `/admin`, `/login` and
`/api` never consult it.

⚠️ Dynamic rendering is now the public site's normal state, and the data
behind it comes from the tagged 60-second `fetch` cache in `lib/*.ts`, not
from the backend on every request. That is also what makes an admin's edits
show up without a redeploy — mutations revalidate their tag and the next
request renders with the new data. Nothing under `[locale]` is prerendered
into the image any more, so a deploy no longer ships a snapshot of the site
that has to catch up with the database.

### SEO
Configured entirely in code, in one file: `lib/seo-config.ts` (canonical origin,
indexing switch, share card, verification tokens, Metrika/GA4 counters, the
`Organization`/`LocalBusiness` facts, per-page `noindex` and keywords). There is
no admin section and no database table behind it — an earlier build had both and
they were dropped: the values change a few times a year, and a form that has to
be kept in sync with the code reading it is a second thing to get wrong.
`SEO.md` in the repo root is the companion doc (in Russian, like `DEPLOYMENT.md`)
— what is set, what is still waiting on the client, and where each value goes.

Page copy is **not** in that config. `<title>`/`description` stay in
`messages/*.json` under `metaTitle`/`metaDescription`, per the data-layer rule
above; products, categories and articles take theirs from their own records.

**Every public page's `generateMetadata` goes through `buildPageMetadata`**
(`lib/page-metadata.ts`) — it owns canonical, hreflang, Open Graph, Twitter and
the robots directives so those are decided once rather than eleven times. Pages
pass their own copy in. It is `async` — it awaits `getSiteSettings()` so a
closed site publishes no page metadata at all (see the maintenance section);
every call site already returns its result straight out of an
`async generateMetadata`, so nothing else had to change.
`app/sitemap.ts` and `app/robots.ts` read the same config (plus `getSiteSettings`
for maintenance mode); JSON-LD is built in `lib/json-ld.ts` and rendered by
`components/seo/json-ld.tsx`.

⚠️ **`tj` is a country code, not a language.** The URL segment stays `tj`
(frozen by `i18n/routing.ts`), but `hreflang`, `<html lang>`, `og:locale` and
`inLanguage` all say `tg`/`tg-TJ`/`tg_TJ` — an invalid tag makes Google drop
the whole alternates cluster, not just the one entry. `HREFLANG_BY_LOCALE` and
`OG_LOCALE` are where that substitution lives.

⚠️ **No prices in structured data.** The `Product` graph carries no `offers`,
`priceRange` or `aggregateRating` — the site publishes no prices and the
calculator is explicitly not a price calculator, so fabricating them is both
untrue and a structured-data penalty. The product page also emits no
`BreadcrumbList`, because it renders no visible trail; giving it one is the fix,
inventing the markup alone is not.

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
bcrypt). CORS is driven by `ALLOWED_ORIGINS` and is empty behind the production
nginx, where everything is same-origin.

The schema lives in Alembic (`migrations/`), applied by the container's
entrypoint — adding a model means adding it to `app/models/__init__.py` (the
registry autogenerate reads) *and* writing a revision. `app/startup.py` seeds a
fresh database, including the six product categories and the six systems the
site shipped with; every seed is skipped once its table has a row.
`scripts/build-products-seed.py` is what generated `app/seeds/products.json`
from the frontend's message catalogues.

⚠️ Every route is an `async def` doing blocking SQLAlchemy work, and `get_db` is
a sync generator, so sessions are checked out from Starlette's 40-thread
threadpool. `database.py`'s pool is sized against that, not against expected
traffic — see its comment before changing it.
