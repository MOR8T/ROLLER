# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ROLLER.TJ — corporate website and product catalog for a PVH (PVC) and aluminum profile systems manufacturer in Tajikistan. Monorepo with a Next.js frontend (built) and a planned FastAPI backend (not started).

## Repository Layout

- `frontend/` — Next.js 16 application (all current production code lives here)
- `backend/` — Planned FastAPI + PostgreSQL backend (empty)
- `.cursor/project_plan/` — 13-stage development plan documents
- `notes/` — Source materials, product photos (gitignored, do not commit)

## Development Commands

All commands run from `frontend/`:

```sh
npm run dev          # Dev server on port 3031
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check
```

No test framework is configured yet.

## Tech Stack

- **Next.js 16.2.10** (App Router) + **React 19** + **TypeScript 5** (strict)
- **Tailwind CSS v4** with custom `@theme` tokens in `app/globals.css`
- **Framer Motion** for animations, **Swiper** for carousels, **Lucide React** for icons
- Path alias: `@/*` maps to the `frontend/` root

## Next.js 16 Warning

This project uses Next.js 16 which has breaking changes from earlier versions. **Before writing any Next.js code, read the relevant guide in `frontend/node_modules/next/dist/docs/`**. Do not assume APIs, conventions, or file structure match your training data.

## Architecture

### Design System
Brand tokens (colors, fonts, spacing) are defined as CSS custom properties via Tailwind `@theme` in `app/globals.css`. Fonts: Chakra Petch (headings), Montserrat (body), loaded via `next/font/google` in `app/layout.tsx`.

### Component Organization
- `components/ui/` — Primitives (Button, Input, Card, Container, Section, Badge, MediaFrame, Reveal)
- `components/layout/` — Header, Footer, LanguageSwitcher, WhatsAppFab
- `components/sections/` — Page sections (HeroSection, ProductsSection, CategoriesSection, etc.)

### Data Layer
- `types/index.ts` — All domain types (Material, Category, Product, Article, Project, Lead, etc.)
- `data/home.ts` — Mock data for the homepage, typed and structured for future API migration
- `lib/site-config.ts` — Navigation, contact info, supported locales (ru, tg, en, tr)
- `lib/utils.ts` — `cn()` classname merge utility (heavily used across all components)

### Current State
Only the homepage (`/`) is implemented. Navigation links to `/catalog`, `/about`, `/portfolio`, `/calculator`, `/news`, `/showroom`, `/contacts` all return 404. i18n is planned but not implemented (`lang="ru"` is hardcoded).

## Graphify Knowledge Graph

The project has a graphify knowledge graph at `graphify-out/`. Use graphify CLI commands to explore cross-file dependencies before grepping:
- `graphify query "<question>"` — scoped subgraph for any question
- `graphify path "<A>" "<B>"` — dependency path between symbols
- `graphify explain "<concept>"` — all nodes related to a concept

Run `graphify update .` after modifying code to keep the graph current (AST-only, no API cost).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
