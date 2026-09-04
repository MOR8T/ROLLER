import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { seoConfig } from "@/lib/seo-config";

/**
 * The helpers that build URLs and language clusters for the site's metadata.
 *
 * Settings come from `lib/seo-config.ts` — a plain module, no backend call. So
 * there is no `async` here, no cache and no "fails open" story: the values are
 * known at build time, and the only way to break them is a typo in the config,
 * which `normalizeSiteUrl` covers.
 */

export { SEO_PAGE_PATHS, seoConfig } from "@/lib/seo-config";
export type { SeoPageKey } from "@/lib/seo-config";

/**
 * URL segment → BCP 47 language tag for `alternates.languages`.
 *
 * ⚠️ The one entry that is not the identity is `tj`. The URL segment stays `tj`
 * — that is what the client's other properties use and what the routing
 * contract froze (`i18n/routing.ts`) — but `tj` is the ISO 3166 *country* code
 * for Tajikistan; the ISO 639 *language* code for Tajik is `tg`. Emitting
 * `hreflang="tj"` would be an invalid tag, and Google drops the entire
 * alternates cluster when one entry is malformed rather than just that entry.
 *
 * The other three carry no region on purpose: `ru` and `en` are read well
 * outside Tajikistan and Turkey, and narrowing them to `ru-TJ`/`en-TJ` would
 * tell Google to show those pages to Tajik visitors only.
 */
export const HREFLANG_BY_LOCALE: Record<Locale, string> = {
  ru: "ru",
  tj: "tg-TJ",
  en: "en",
  tr: "tr",
};

/**
 * Trims an origin to `scheme://host[:port]` with no trailing slash.
 *
 * A human writes that config value, so `roller.tj` and `https://roller.tj/`
 * both have to land on the same result: without a scheme `new URL()` throws and
 * every canonical on the site disappears with it, and a trailing slash turns
 * into `https://roller.tj//ru`.
 */
function normalizeSiteUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withScheme).origin;
}

/** The site origin, ready to concatenate — unlike raw `seoConfig.siteUrl`. */
export const siteUrl = normalizeSiteUrl(seoConfig.siteUrl);

/**
 * `/ru/about` — a page's path with its locale prefix.
 *
 * Always prefixed, the default locale included, because `i18n/routing.ts` sets
 * `localePrefix: "always"`. A canonical that dropped the `/ru` would point at a
 * URL that answers with a 307, and a redirecting canonical is one Google
 * discards.
 */
export function localizedPath(locale: string, path: string): string {
  return `/${locale}${path}`;
}

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * The `alternates` block: this page's canonical, one entry per locale, and
 * `x-default` pointing at Russian.
 *
 * `x-default` matters more here than on a typical multilingual site — four
 * languages for one small market means a lot of visitors Google cannot place,
 * and without it they get an essentially arbitrary one of the four. Russian is
 * the default locale and the language the site is actually written in.
 */
export function buildAlternates(locale: string, path: string) {
  const languages: Record<string, string> = {};
  for (const item of locales) {
    languages[HREFLANG_BY_LOCALE[item]] = absoluteUrl(localizedPath(item, path));
  }
  languages["x-default"] = absoluteUrl(localizedPath(defaultLocale, path));

  return {
    canonical: absoluteUrl(localizedPath(locale, path)),
    languages,
  };
}
