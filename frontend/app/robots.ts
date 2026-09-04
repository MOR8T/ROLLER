import type { MetadataRoute } from "next";

import { absoluteUrl, siteUrl } from "@/lib/seo";
import { seoConfig } from "@/lib/seo-config";
import { getSiteSettings } from "@/lib/site-settings";

/**
 * `/robots.txt`.
 *
 * Two shapes, decided at request time from the admin panel's own switches:
 *
 *   closed  «Сайт в разработке» is on, or «Разрешить индексацию» is off →
 *           `Disallow: /` for everyone, and no sitemap line. This is the
 *           crawl-level counterpart to the `noindex` those switches already
 *           put in the pages' `<head>`; both are needed, because `noindex` only
 *           works on a page the crawler is allowed to fetch and read.
 *
 *   open    everything public is crawlable, with the admin surface excluded.
 *
 * ⚠️ `Disallow` is not a security control and nothing here is treated as one.
 * `/admin` and `/login` are listed to keep them out of search results, and
 * they are protected by the session check in `lib/admin-auth.ts` — this file
 * only stops well-behaved crawlers from wasting requests on pages that redirect
 * them to a login form.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteSettings = await getSiteSettings();

  if (!seoConfig.allowIndexing || siteSettings.maintenanceMode) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/login",
          "/api/",
          // `?page=` is the news list's own pagination. The pages are real and
          // reachable, but each is a slice of one feed rather than a document
          // of its own — crawling page 2 costs a request and adds nothing a
          // crawler cannot reach from page 1's links.
          "/*?page=",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    // Canonical hostname for Yandex, which is the search engine that matters
    // most in this market and the only major one that still reads this
    // directive. Google ignores it and relies on the canonical tags instead.
    host: siteUrl,
  };
}
