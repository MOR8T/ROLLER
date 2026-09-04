import type { MetadataRoute } from "next";

import { locales, defaultLocale } from "@/i18n/routing";
import { HREFLANG_BY_LOCALE, SEO_PAGE_PATHS, absoluteUrl, localizedPath } from "@/lib/seo";
import { seoConfig } from "@/lib/seo-config";
import { getSiteSettings } from "@/lib/site-settings";
import { fetchLatestNews } from "@/lib/news";
import { productCategoryParams, productParams } from "@/lib/products";
import { productCategoryHref, productHref } from "@/lib/product-links";

/**
 * `/sitemap.xml`.
 *
 * Every public URL, in all four locales, each entry carrying the
 * `xhtml:link` alternates for its three siblings — the same cluster
 * `lib/seo.ts`'s `buildAlternates` puts in the pages' `<head>`. Stating it in
 * both places is not redundancy: Google treats a mismatch between the two as a
 * reason to distrust the cluster, and a sitemap is the only one of the two a
 * crawler reads without fetching every page first.
 *
 * ⚠️ `/products` is deliberately absent — that index page was removed in
 * 2026-08 and the category pages are the entry points (see `CLAUDE.md`). The
 * addresses here are `/products/<category_id>` and
 * `/products/<category_id>/<product_id>`, database ids rather than slugs, which
 * is why they come from `lib/products.ts` rather than from a static list.
 *
 * Dynamic by construction: an article published in the admin panel appears here
 * on the next revalidation of the `news` tag, without a rebuild.
 */

/**
 * `alternates.languages` for one path — the four locale URLs plus `x-default`,
 * keyed by BCP 47 tag rather than by URL segment (`tj` → `tg-TJ`).
 */
function alternatesFor(path: string) {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[HREFLANG_BY_LOCALE[locale]] = absoluteUrl(localizedPath(locale, path));
  }
  languages["x-default"] = absoluteUrl(localizedPath(defaultLocale, path));
  return { languages };
}

/** One sitemap entry per locale for a single path, all sharing one alternates cluster. */
function entriesForPath(
  path: string,
  options: {
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    lastModified?: Date;
  },
): MetadataRoute.Sitemap {
  return locales.map((locale) => ({
    url: absoluteUrl(localizedPath(locale, path)),
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: alternatesFor(path),
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteSettings = await getSiteSettings();

  // Nothing to offer a crawler while the site is a placeholder or explicitly
  // out of the index. An empty sitemap is a valid one and says "I have no URLs
  // for you today", which is exactly right; omitting the file entirely would
  // instead read as a misconfiguration.
  if (!seoConfig.allowIndexing || siteSettings.maintenanceMode) return [];

  const now = new Date();

  // The six static pages. `home` is first and weighted highest; the rest sit
  // below it in the order the header lists them.
  const staticEntries = (
    [
      ["home", 1.0, "weekly"],
      ["about", 0.7, "monthly"],
      ["calculator", 0.8, "monthly"],
      ["news", 0.7, "weekly"],
      ["showroom", 0.6, "monthly"],
      ["contacts", 0.6, "yearly"],
    ] as const
  ).flatMap(([key, priority, changeFrequency]) =>
    entriesForPath(SEO_PAGE_PATHS[key], { priority, changeFrequency, lastModified: now }),
  );

  // Each of these three fails soft on its own: an unreachable backend costs
  // that section of the sitemap, not the whole file. A partial sitemap still
  // gets the static pages crawled; a thrown error would return a 500 to
  // Search Console and get the submission marked as broken.
  const [categories, products, articles] = await Promise.all([
    productCategoryParams().catch(() => []),
    productParams().catch(() => []),
    // The feed is read in the default locale only — the article set and its
    // dates are locale-independent, and the four URLs come from the alternates
    // cluster rather than from four separate fetches.
    fetchLatestNews(defaultLocale, 1000).catch(() => []),
  ]);

  const categoryEntries = categories.flatMap(({ category }) =>
    entriesForPath(productCategoryHref(Number(category)), {
      priority: 0.8,
      changeFrequency: "monthly",
      lastModified: now,
    }),
  );

  const productEntries = products.flatMap(({ category, product }) =>
    entriesForPath(productHref(Number(category), Number(product)), {
      priority: 0.9,
      changeFrequency: "monthly",
      lastModified: now,
    }),
  );

  const articleEntries = articles.flatMap((article) =>
    entriesForPath(`/news/${article.slug}`, {
      priority: 0.5,
      changeFrequency: "yearly",
      // A published article's own date, not `now` — a `lastmod` that moves
      // every time the sitemap regenerates is one crawlers learn to ignore.
      lastModified: new Date(article.publishedAt),
    }),
  );

  return [...staticEntries, ...categoryEntries, ...productEntries, ...articleEntries];
}
