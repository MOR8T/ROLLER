import type { Metadata } from "next";

import { siteConfig } from "@/lib/site-config";
import { seoConfig, type SeoPageKey } from "@/lib/seo-config";
import { absoluteUrl, buildAlternates, localizedPath, siteUrl } from "@/lib/seo";
import { locales, type Locale } from "@/i18n/routing";

/**
 * The one place a page's `<head>` is assembled.
 *
 * Every `generateMetadata` on the public site calls this instead of returning a
 * `{ title, description }` literal of its own, so canonical, hreflang, Open
 * Graph, Twitter cards and the robots directives are decided once rather than
 * eleven times. A page still owns its *copy* — it passes the title and
 * description it reads from `messages/*.json`, like every other string.
 *
 * Synchronous: the settings are a plain module, not a fetch. Calling it from an
 * `async generateMetadata` is fine — the returned object is simply wrapped in a
 * promise.
 */

/**
 * `og:locale` wants a POSIX-ish `language_TERRITORY`, not a BCP 47 tag, so this
 * is a third spelling of the same four locales — after the URL segment
 * (`i18n/routing.ts`) and the hreflang tag (`lib/seo.ts`). Tajik is `tg_TJ` here
 * for the reason spelled out in `HREFLANG_BY_LOCALE`: the language is `tg`, only
 * the URL says `tj`.
 */
const OG_LOCALE: Record<Locale, string> = {
  ru: "ru_RU",
  tj: "tg_TJ",
  en: "en_US",
  tr: "tr_TR",
};

export interface PageMetadataInput {
  locale: string;
  /** Path *without* the locale prefix: `"/about"`, `"/news/some-slug"`, `""`. */
  path: string;
  /** This page's key in `seoConfig` — drives its keywords and `noindexPages`. */
  pageKey?: SeoPageKey;
  title: string;
  description: string;
  /**
   * A page-specific share image — a product photo, an article's cover. Falls
   * back to the site-wide `seoConfig.ogImage`.
   */
  image?: string;
  /** `article` for a news item; everything else on this site is a `website`. */
  type?: "website" | "article";
  /** ISO date, article pages only. */
  publishedTime?: string;
  /**
   * Keeps a page out of the index on top of `seoConfig.noindexPages` — used by
   * `/news?page=2` and friends, which are real pages but not ones worth a
   * search result of their own.
   */
  noindex?: boolean;
  /**
   * Skips the root layout's `%s | ROLLER` title template.
   *
   * Only the homepage passes this. Its title is already the full brand line
   * («ROLLER — Профильные системы…»), so letting the template run would produce
   * «ROLLER — … | ROLLER» — the brand twice in a 60-character budget a search
   * result will truncate anyway.
   */
  absoluteTitle?: boolean;
}

export function buildPageMetadata({
  locale,
  path,
  pageKey,
  title,
  description,
  image,
  type = "website",
  publishedTime,
  noindex = false,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const activeLocale = (locales as readonly string[]).includes(locale)
    ? (locale as Locale)
    : ("ru" as Locale);

  const keywords = pageKey ? seoConfig.keywords[pageKey]?.[activeLocale] : undefined;

  const imagePath = image || seoConfig.ogImage;
  const imageUrl = imagePath ? absoluteUrl(imagePath) : undefined;

  // Three independent ways a page ends up out of the index, and any one of them
  // is enough: the site-wide switch, the config's page list, and the caller's
  // own flag. `googleBot` is spelled out separately because
  // `max-image-preview:large` is what gets a photo into the result card, and it
  // only applies to a page that is indexed at all.
  const isIndexable =
    seoConfig.allowIndexing && !(pageKey && seoConfig.noindexPages.includes(pageKey)) && !noindex;

  return {
    metadataBase: new URL(siteUrl),
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: buildAlternates(activeLocale, path),
    robots: isIndexable
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
    openGraph: {
      type,
      siteName: siteConfig.name,
      title,
      description,
      url: absoluteUrl(localizedPath(activeLocale, path)),
      locale: OG_LOCALE[activeLocale],
      // The other three, so a share card on a Turkish page can tell a crawler
      // the same content exists in Russian.
      alternateLocale: locales
        .filter((item) => item !== activeLocale)
        .map((item) => OG_LOCALE[item]),
      ...(publishedTime ? { publishedTime } : {}),
      ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      // `summary_large_image` needs an image to be worth asking for; without one
      // it renders as an empty banner, so the small card is the honest default
      // until the client sends a share image.
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
  };
}
