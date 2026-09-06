import { hasLocale } from "next-intl";

import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { BACKEND_API_URL } from "@/lib/admin-auth";

/**
 * The news section's data access layer.
 *
 * Everything the site knows about news comes through the four functions
 * below. News is managed from the admin panel
 * (`app/admin/(dashboard)/news/page.tsx`, `news-actions.ts`) and stored in
 * the backend with a title, an optional excerpt and a Tiptap-authored body
 * per locale (`title_ru`/`title_tj`/…, see `RawNewsArticle`); this module
 * picks out the one `locale` a page needs, same split as `lib/hero-slides.ts`
 * and `lib/partners.ts`.
 *
 * Two rules keep that split honest:
 *
 *   1. **Nothing outside this file reads `/api/news` directly.** Components
 *      take `NewsArticle` objects as props; pages call these functions.
 *   2. **The full (all-locale) list is fetched once and cached under the
 *      `"news"` tag** — the admin's mutations revalidate that tag, so a
 *      change shows up on `/` and `/news` immediately rather than waiting
 *      for its 60s revalidate.
 */

/** One article, picked out for a single locale. */
export interface NewsArticle {
  /** URL segment, Latin in every locale — the article's identity. Auto-generated
   * from the Russian title when the admin creates the article (`routes/news.py`). */
  slug: string;
  cover: string;
  /** ISO-8601 date. Formatted per locale at render time, never here. */
  publishedAt: string;
  title: string;
  excerpt: string;
  /** Tiptap's HTML output for this locale. */
  body: string;
}

interface RawNewsArticle {
  id: number;
  slug: string;
  cover_path: string;
  published_at: string;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  excerpt_ru: string | null;
  excerpt_tj: string | null;
  excerpt_en: string | null;
  excerpt_tr: string | null;
  body_ru: string;
  body_tj: string;
  body_en: string;
  body_tr: string;
}

/**
 * Admin uploads and seeded files are both served from this app's own origin,
 * so an API path needs nothing done to it — `/uploads/...` is answered by
 * nginx in production and by `next.config.ts`'s rewrite everywhere else, and
 * `next/image` optimises it like any local file. See that rewrite's comment
 * for why the absolute-URL version had to go.
 *
 * Kept as a function rather than inlined: this is the seam a CDN prefix would
 * be added at, and every DTO in this file already goes through it.
 */
function resolveCoverSrc(coverPath: string): string {
  return coverPath;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Long enough to read as a real subtitle, short enough not to duplicate the body. */
const EXCERPT_FALLBACK_LENGTH = 160;

/** The admin's excerpt field is optional — a blank one falls back to a
 * trimmed plain-text lead of the body, generated here rather than stored,
 * so editing the body keeps the fallback in sync automatically. */
function excerptFallback(bodyHtml: string): string {
  const text = stripHtml(bodyHtml);
  return text.length > EXCERPT_FALLBACK_LENGTH
    ? `${text.slice(0, EXCERPT_FALLBACK_LENGTH).trimEnd()}…`
    : text;
}

function toArticle(raw: RawNewsArticle, locale: Locale): NewsArticle {
  const title: Record<Locale, string> = {
    ru: raw.title_ru,
    tj: raw.title_tj,
    en: raw.title_en,
    tr: raw.title_tr,
  };
  const excerpt: Record<Locale, string | null> = {
    ru: raw.excerpt_ru,
    tj: raw.excerpt_tj,
    en: raw.excerpt_en,
    tr: raw.excerpt_tr,
  };
  const body: Record<Locale, string> = {
    ru: raw.body_ru,
    tj: raw.body_tj,
    en: raw.body_en,
    tr: raw.body_tr,
  };

  const localizedBody = body[locale] ?? body[defaultLocale];
  const localizedExcerpt = excerpt[locale] ?? excerpt[defaultLocale];

  return {
    slug: raw.slug,
    cover: resolveCoverSrc(raw.cover_path),
    publishedAt: raw.published_at,
    title: title[locale] ?? title[defaultLocale],
    excerpt: localizedExcerpt?.trim() ? localizedExcerpt : excerptFallback(localizedBody),
    body: localizedBody,
  };
}

/**
 * Cards per page on `/news` — imzo.uz's own figure, and it lands on our grid:
 * four full rows of three on desktop, six of two on tablet.
 */
export const NEWS_PAGE_SIZE = 12;

export interface NewsPage {
  items: NewsArticle[];
  /** The page actually served, after clamping. */
  page: number;
  pageCount: number;
  total: number;
}

/**
 * The full, all-locale feed, newest first. Returns `[]` — never throws, never
 * a fabricated placeholder — if the backend is unreachable or has no
 * articles yet; callers render a skeleton in that case.
 */
async function loadRaw(): Promise<RawNewsArticle[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/news`, {
      next: { revalidate: 60, tags: ["news"] },
    });
    if (!res.ok) return [];

    const data: RawNewsArticle[] = await res.json();
    return data
      .slice()
      .sort((a, b) =>
        a.published_at < b.published_at ? 1 : a.published_at > b.published_at ? -1 : 0,
      );
  } catch {
    return [];
  }
}

/**
 * `locale` is the raw route segment, because that is what a page has —
 * `PageProps` types it as `string`, and only the layout narrows it. The same
 * `hasLocale` guard the layout uses narrows it here, and anything else falls
 * back to the default locale rather than throwing: a bad segment is already
 * a 404 by then.
 */
async function loadFeed(locale: string): Promise<NewsArticle[]> {
  const key: Locale = hasLocale(routing.locales, locale) ? locale : defaultLocale;
  const raw = await loadRaw();
  return raw.map((item) => toArticle(item, key));
}

/** Clamps anything a visitor can put in `?page=` down to a page that exists. */
export function normalizeNewsPage(value: string | string[] | undefined, pageCount: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(parsed, 1), Math.max(pageCount, 1));
}

/**
 * One page of the list. `page` is clamped rather than 404'd: `?page=99` is a
 * hand-edited URL or a stale link, and the last page is a better answer than
 * an error page.
 */
export async function fetchNewsPage(locale: string, page: string | string[] | undefined = "1") {
  const items = await loadFeed(locale);
  const pageCount = Math.max(1, Math.ceil(items.length / NEWS_PAGE_SIZE));
  const current = normalizeNewsPage(page, pageCount);
  const start = (current - 1) * NEWS_PAGE_SIZE;

  return {
    items: items.slice(start, start + NEWS_PAGE_SIZE),
    page: current,
    pageCount,
    total: items.length,
  } satisfies NewsPage;
}

export async function fetchArticle(locale: string, slug: string): Promise<NewsArticle | undefined> {
  const items = await loadFeed(locale);
  return items.find((article) => article.slug === slug);
}

/**
 * The newest few, for the blocks that are not the list itself — the homepage
 * carousel and the "more materials" strip under an article. Fifteen cards is a
 * page; three is a mention.
 */
export async function fetchLatestNews(
  locale: string,
  count: number,
  excludeSlug?: string,
): Promise<NewsArticle[]> {
  const items = await loadFeed(locale);
  return items.filter((article) => article.slug !== excludeSlug).slice(0, count);
}

// `newsParams()` used to live here, feeding the article page's
// `generateStaticParams`. Both are gone — see that page's comment; the sitemap
// builds its article URLs from `fetchLatestNews` and never needed this.

export function articleHref(slug: string): string {
  return `/news/${slug}`;
}
