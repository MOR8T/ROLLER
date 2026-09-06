import type { Locale } from "@/i18n/routing";

/**
 * The one place the site's SEO is configured.
 *
 * This used to be a database table and an admin panel section; both were
 * dropped in favour of code. These values change a few times a year at most,
 * and editing one file and deploying is more honest than a thirty-field form
 * nobody opens — the form also had to be kept in sync with the code that read
 * it, which is a second thing to get wrong.
 *
 * `SEO.md` in the repository root is the companion document: what is already
 * configured, what is still waiting on the client, and where each value goes.
 *
 * ⚠️ An empty string is a working state, not an unfinished one. A blank
 * verification code renders no tag at all, a blank counter loads no script, and
 * nothing about the site breaks. That is exactly the state this ships in while
 * the client has no Search Console or Metrika account.
 *
 * Page copy — `<title>`, `description` — is deliberately *not* here. It lives
 * in `messages/{ru,tj,en,tr}.json` under `metaTitle`/`metaDescription`, like
 * every other string on the site. That is `CLAUDE.md`'s data-layer rule —
 * structure in code, text in the message catalogues — and SEO is not an
 * exception to it.
 */

/** The pages that have a canonical URL and an entry in `sitemap.xml`. */
export const SEO_PAGE_PATHS = {
  home: "",
  about: "/about",
  calculator: "/calculator",
  news: "/news",
  showroom: "/showroom",
  contacts: "/contacts",
} as const;

export type SeoPageKey = keyof typeof SEO_PAGE_PATHS;

interface SeoConfig {
  /**
   * The production origin, no trailing slash.
   *
   * `metadataBase`, every canonical, `sitemap.xml`, `robots.txt` and every
   * absolute URL in the JSON-LD are built from it, so a typo here shows up in
   * four places at once. `normalizeSiteUrl` in `lib/seo.ts` covers a missing
   * scheme and a stray slash, but it is a safety net, not a licence.
   */
  siteUrl: string;

  /**
   * The master indexing switch.
   *
   * `false` → every page gets `noindex, nofollow`, `robots.txt` disallows
   * everything and `sitemap.xml` comes back empty. It exists for a staging
   * domain, or for a live site the client does not yet want found. Not the same
   * decision as «Сайт в разработке» in the admin panel: that one hides the site
   * from *visitors*, this one only from search engines.
   */
  allowIndexing: boolean;

  /**
   * The 1200×630 card shown when someone shares a link in WhatsApp, Telegram or
   * Facebook. A path inside `public/`.
   *
   * Blank → no image in the preview, and `twitter:card` drops to `summary`
   * instead of `summary_large_image`, because a large card with no image is an
   * empty banner.
   */
  ogImage: string;

  /** Site-ownership tokens. The bare token, not the whole `<meta>` tag. */
  verification: {
    google: string;
    yandex: string;
  };

  /** Blank → the counter's script is not loaded at all. */
  analytics: {
    /** Yandex.Metrika counter number, e.g. `"98765432"`. */
    yandexMetrika: string;
    /**
     * Google Tag Manager container id, e.g. `"GTM-XXXXXXX"`.
     *
     * GTM is a container, not a counter: whatever tags the client adds inside
     * it — GA4, Ads, a pixel — load through this one id, and adding another tag
     * later needs no code change here.
     *
     * ⚠️ Which is why `googleAnalytics` below should stay blank while this is
     * set, unless GA4 is deliberately *not* configured inside the container.
     * Loading GA4 both ways sends every pageview twice, and the inflated
     * numbers look like real traffic rather than like a misconfiguration.
     */
    googleTagManager: string;
    /**
     * GA4 measurement id, e.g. `"G-XXXXXXXXXX"` — for wiring GA4 directly,
     * without Tag Manager. See the warning above before filling both.
     */
    googleAnalytics: string;
  };

  /**
   * Facts for the `Organization`/`LocalBusiness` markup.
   *
   * Only what has nowhere else to live. The phone, email and per-locale address
   * come from `contact_info` (admin panel → «Контакты»), the social profiles
   * from `social_links`, and the founding year from `lib/site-config.ts`.
   * Copying any of those here would create a second version of the same address
   * that eventually disagrees with the one the page renders.
   */
  organization: {
    /** Legal name, where it differs from the brand. */
    legalName: string;
    streetAddress: string;
    locality: string;
    postalCode: string;
    /** ISO 3166-1 alpha-2. */
    countryCode: string;
    /** Coordinates as strings, the way Yandex.Maps hands them over. */
    latitude: string;
    longitude: string;
    /** schema.org syntax, e.g. `"Mo-Sa 08:00-18:00"`. */
    openingHours: string;
  };

  /**
   * Pages that stay reachable for visitors but should not appear in search.
   *
   * Products, categories and articles are not covered by this: they come from
   * the database, and hiding one of them belongs on its own record rather than
   * in a list here.
   */
  noindexPages: SeoPageKey[];

  /**
   * Comma-separated keywords per page, per locale.
   *
   * Optional and close to pointless: Google has ignored `<meta name="keywords">`
   * since 2009 and Yandex gives it next to nothing. It is here because the
   * client asked for a complete set of metadata, and because an empty object
   * costs nothing — the tag simply is not rendered.
   */
  keywords: Partial<Record<SeoPageKey, Partial<Record<Locale, string>>>>;
}

export const seoConfig: SeoConfig = {
  siteUrl: "https://roller.tj",

  allowIndexing: true,

  // ⚠️ No file yet — the client has not sent a 1200×630 banner. Put it in
  // `public/og/` and name it here, e.g. "/og/roller.jpg".
  ogImage: "",

  verification: {
    // Search Console → «Способ подтверждения» → «HTML-тег».
    google: "",
    // Яндекс.Вебмастер → «Настройки» → «Права доступа» → «Мета-тег».
    yandex: "",
  },

  analytics: {
    yandexMetrika: "",
    googleTagManager: "GTM-T9M25WW9",
    // Intentionally blank: GA4 is expected to be configured inside the Tag
    // Manager container above. Filling this in as well would double-count.
    googleAnalytics: "",
  },

  organization: {
    legalName: "",
    streetAddress: "",
    locality: "",
    postalCode: "",
    countryCode: "TJ",
    latitude: "",
    longitude: "",
    openingHours: "",
  },

  noindexPages: [],

  keywords: {},
};
