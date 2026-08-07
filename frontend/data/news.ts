/**
 * News mock (`project_plan/07-secondary-pages.md`).
 *
 * The list and the article bodies are placeholders: the news section is run
 * from the admin panel (stage 12), and what is being delivered here is the
 * list page, the article page and the shape the API will return. Text lives in
 * `messages/*.json` under `news.items.<id>`, including the body paragraphs —
 * on the backend that becomes a JSONB field per locale.
 */

export interface ArticleRecord {
  /** Key into the message catalogue. */
  id: string;
  /** URL segment, Latin in every locale. */
  slug: string;
  cover: string;
  /** ISO-8601. Rendered through `next-intl`'s formatter per locale. */
  date: string;
}

export const articles: ArticleRecord[] = [
  {
    id: "new-stella-line-launch",
    slug: "stella-line-launch",
    cover: "/news/stella-window.png",
    date: "2026-05-12",
  },
  {
    id: "thermo-facade-project",
    slug: "thermo-facade-project",
    cover: "/news/thermo-anthracite.png",
    date: "2026-04-03",
  },
  {
    id: "service-expansion-2026",
    slug: "service-expansion-2026",
    cover: "/news/roller-windows.png",
    date: "2026-03-18",
  },
];

export function articleHref(slug: string): string {
  return `/news/${slug}`;
}

export function findArticleBySlug(slug: string): ArticleRecord | undefined {
  return articles.find((article) => article.slug === slug);
}

/** Newest first, excluding the one being read. */
export function otherArticles(article: ArticleRecord): ArticleRecord[] {
  return articles.filter((candidate) => candidate.slug !== article.slug);
}

export const articleParams = articles.map((article) => ({ article: article.slug }));
