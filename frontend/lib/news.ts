import { hasLocale } from "next-intl";

import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import en from "@/data/news/en.json";
import ru from "@/data/news/ru.json";
import tg from "@/data/news/tg.json";
import tr from "@/data/news/tr.json";

/**
 * The news section's data access layer — and the seam where the backend lands.
 *
 * Everything the site knows about news comes through the four functions below.
 * Today they resolve out of `data/news/<locale>.json`; when stage 12 ships,
 * each body becomes a `fetch` against the admin panel's API and **nothing else
 * on the site changes** — the JSON files are already shaped like the responses
 * (`{ items: [...] }`, one document per locale, `publishedAt` in ISO-8601).
 *
 * Two rules keep that promise honest:
 *
 *   1. **Nothing imports `data/news/*.json` directly.** Components take
 *      `NewsArticle` objects as props; pages call these functions.
 *   2. **They are `async` even though the JSON is synchronous.** An await that
 *      is free today costs nothing; a caller written against a synchronous API
 *      has to be rewritten when the network appears.
 *
 * The article text lives here rather than in `messages/*.json` because the
 * admin panel — not a translator editing the message catalogue — is what will
 * own it. UI chrome around the articles («Читать», «Все новости», the page
 * title) stays in the catalogue.
 */

/**
 * One article as the API will return it.
 *
 * Diverges from `Article` in `types/index.ts` on `body`: the contract there has
 * a single string for rendered rich text, and until an editor exists the mock
 * carries plain paragraphs, which is an array. Reconcile at stage 12, when
 * there is a real editor to say which one is true.
 */
export interface NewsArticle {
  /** URL segment, Latin in every locale — the article's identity. */
  slug: string;
  cover: string;
  /** ISO-8601. Formatted per locale at render time, never here. */
  publishedAt: string;
  title: string;
  excerpt: string;
  body: string[];
}

interface NewsFeed {
  items: NewsArticle[];
}

const feeds: Record<Locale, NewsFeed> = { ru, tg, en, tr };

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
 * Newest first. The JSON is stored in that order and is not re-sorted here.
 *
 * `locale` is the raw route segment, because that is what a page has —
 * `PageProps` types it as `string`, and only the layout narrows it. The same
 * `hasLocale` guard the layout uses narrows it here, and anything else falls
 * back to the default locale rather than throwing: a bad segment is already
 * a 404 by then.
 */
async function loadFeed(locale: string): Promise<NewsArticle[]> {
  const key: Locale = hasLocale(routing.locales, locale) ? locale : defaultLocale;
  return feeds[key].items;
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

/**
 * Slugs for `generateStaticParams`. Synchronous and single-locale on purpose:
 * slugs are Latin and identical across locales (see `i18n/routing.ts`), so one
 * feed answers for all four. When the API arrives this becomes the one call
 * made at build time.
 */
export function newsParams() {
  return ru.items.map((article) => ({ article: article.slug }));
}

export function articleHref(slug: string): string {
  return `/news/${slug}`;
}
