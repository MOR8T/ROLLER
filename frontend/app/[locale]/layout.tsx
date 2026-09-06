import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Chakra_Petch, Montserrat } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { Header } from "@/components/layout/header";
import { getProductsMenu } from "@/lib/products";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";
import { MaintenanceScreen } from "@/components/layout/maintenance-screen";
import { getSiteSettings } from "@/lib/site-settings";
import { readMaintenancePreviewCookie, verifyPreviewCode } from "@/lib/maintenance-access";
import { routing } from "@/i18n/routing";
import { seoConfig } from "@/lib/seo-config";
import { siteUrl } from "@/lib/seo";
import { buildOrganizationJsonLd, buildWebSiteJsonLd } from "@/lib/json-ld";
import { JsonLd } from "@/components/seo/json-ld";
import { Analytics, AnalyticsNoScript } from "@/components/seo/analytics";

/**
 * Fonts.
 *
 * `subsets` controls PRELOADING only — `next/font` emits `@font-face` blocks
 * for every subset a font ships, so glyphs outside the list still render; the
 * browser just fetches them on demand through `unicode-range`. It is a
 * bandwidth trade-off, not a correctness one.
 *
 * ⚠️ Preloading **cannot** be selected per locale, contrary to what
 * `project_plan/03-i18n-foundation.md` assumes. `next/font` emits its
 * `<link rel="preload">` tags for every font instance in the *rendered route's
 * module graph*, not for the instance whose className is applied, and all four
 * locales share this one route module. Both shapes were built and measured:
 * four bindings side by side here, and four separate modules behind a dynamic
 * `import()`. Each preloaded the union — 12 files on every one of `/ru`, `/tj`,
 * `/en`, `/tr` — which is precisely the doubling the plan set out to avoid.
 *
 * So the list is global, and the budget is spent differently instead.
 * Chakra Petch is loaded at two weights rather than four: a grep of every
 * `font-heading` usage finds only `font-semibold` (600) and `font-bold` (700),
 * so 400 and 500 were four preloaded files nothing rendered. Those two files
 * pay for `cyrillic-ext` and `latin-ext` on Montserrat, which is where they
 * matter — Tajik `ғ қ ҳ ҷ ӣ ӯ` and Turkish `ğ ş İ` appear in running body text
 * (≈200 and ≈75 times respectively on the homepage), and without preloading
 * they arrive late enough to flash.
 *
 * Net: 6 preloaded files, the same as before, now covering all four locales'
 * body text instead of Russian's alone.
 */
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  display: "swap",
});

/**
 * Chakra Petch ships no Cyrillic subset at all — only latin, latin-ext, thai
 * and vietnamese — so it is effectively reserved for brand names (ROLLER,
 * STELLA, UNOPEN) and numerals, and Cyrillic headings fall through to
 * Montserrat by design (DESIGN.md §4).
 *
 * `latin-ext` is deliberately omitted: the only glyphs it would add are the
 * Turkish ğ ş İ *in headings*, a far smaller surface than body text, and it
 * would cost two more preloaded files on all four locales.
 *
 * ⚠️ `--font-chakra-petch` expands to `"Chakra Petch", "Chakra Petch Fallback"`,
 * and that second family is a metrics-adjusted `local(Arial)` declared over
 * `U+0-10FFFF` — it claims every codepoint, Cyrillic included. That is why the
 * heading chain in `globals.css` names Chakra Petch literally rather than going
 * through this variable; see the note there. `adjustFontFallback: false` would
 * be the tidy fix, but Next 16.2.10 ignores it on the Turbopack path.
 */
const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Omit<LayoutProps<"/[locale]">, "children">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};

  // Read before anything branches on it — see the note on
  // `readMaintenancePreviewCookie`. Both this function and the layout below
  // are on every page's path, and both must reach `cookies()` whatever the
  // switch says, or the pages compile static and freeze the first time it is
  // turned on.
  const previewCode = await readMaintenancePreviewCookie();

  // While «Сайт в разработке» is on there is no site to describe, and nothing
  // worth indexing: the tab reads as the placeholder and crawlers are told to
  // stay away, so a search engine that happens to recrawl during the closure
  // does not replace the real listings with it.
  const { maintenanceMode } = await getSiteSettings();

  // …unless this visitor holds a valid preview code, in which case they are
  // looking at the real site and its metadata should describe it. `robots`
  // below still says `noindex` for them, and rightly: a crawler cannot hold
  // the cookie, so the only reader of the real title here is the person who
  // typed the code.
  const previewing = maintenanceMode && (await verifyPreviewCode(previewCode));

  // `metadataBase` is what every relative canonical and `og:image` on the site
  // resolves against. It is set here, in the one layout every public page
  // passes through, rather than in each page: Next merges metadata down the
  // tree, and a page that forgot it would silently resolve its canonical
  // against `http://localhost:3000` — the exact failure the note in
  // `app/[locale]/news/page.tsx` refused to risk before this value had a home.
  const metadataBase = new URL(siteUrl);

  // The two search-console tokens. Rendered on every page rather than only on
  // the homepage because Google and Yandex both re-verify against whatever URL
  // they happen to crawl, and a token that disappears mid-site is read as
  // verification withdrawn.
  const verification = {
    ...(seoConfig.verification.google ? { google: seoConfig.verification.google } : {}),
    ...(seoConfig.verification.yandex ? { yandex: seoConfig.verification.yandex } : {}),
  };

  if (maintenanceMode && !previewing) {
    const tMaintenance = await getTranslations({ locale, namespace: "maintenance" });
    return {
      metadataBase,
      title: tMaintenance("title"),
      robots: { index: false, follow: false },
      verification,
    };
  }

  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase,
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    verification,
    // The site-wide switch. A page that sets its own `robots` (all of them do,
    // through `buildPageMetadata`) overrides this; it is the floor for
    // anything that does not — `not-found`, and any route added later that
    // forgets its own metadata.
    ...(seoConfig.allowIndexing && !previewing ? {} : { robots: { index: false, follow: false } }),
  };
}

/**
 * `<html lang>`.
 *
 * ⚠️ Not the URL segment. `tj` is the ISO 3166 country code for Tajikistan;
 * the ISO 639 language code for Tajik is `tg`, and `lang="tj"` is simply
 * invalid — screen readers fall back to the browser default and Google reads
 * no language at all. Same substitution, same reason, as
 * `HREFLANG_BY_LOCALE` in `lib/seo.ts`; the URL keeps saying `tj`.
 */
/**
 * The one line of JavaScript behind the press states in `globals.css`.
 *
 * Safari on iOS does not apply `:active` to a tapped element unless the page
 * has a touch listener somewhere — a quirk it has carried since the original
 * iPhone, on the reasoning that a page with no touch handling probably was not
 * written for a finger. An empty listener on `document` is the long-standing
 * answer: it costs nothing, it is `passive` so it cannot delay a scroll, and it
 * is what makes the press feedback — and the `active:` / `group-active:`
 * utilities across the components — actually fire on an iPhone rather than
 * only in Chrome's device emulation.
 *
 * Inline rather than a client component: it must run before hydration (the
 * first taps happen while the bundle is still arriving) and it has no business
 * pulling React in for one `addEventListener`.
 */
const TOUCH_ACTIVE_SHIM = 'document.addEventListener("touchstart",function(){},{passive:true})';

function htmlLang(locale: string): string {
  return locale === "tj" ? "tg" : locale;
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Hands the locale to every `getTranslations()` below this layout that does
  // not name one itself. (It used to also buy back static rendering after
  // `await params`; the cookie read below gives that up on purpose — see the
  // note there.)
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });

  // ⚠️ Unconditional, and load-bearing: this is the Request-time API that
  // makes every page under `app/[locale]` render per request instead of being
  // prerendered at build time. `readMaintenancePreviewCookie` carries the full
  // story; the short version is that a prerendered page cannot start reading a
  // cookie later, so a build made with the switch off could never show the
  // placeholder once an admin turned it on — it kept serving the HTML CI baked
  // without a backend. Dynamic rendering is also what makes an admin's edits
  // appear on the site without another deploy.
  const previewCode = await readMaintenancePreviewCookie();

  // «Настройки сайта» → «Сайт в разработке». Gated here rather than in
  // `proxy.ts` because the flag lives in the backend: the proxy runs on every
  // request, including static assets, and would have to reach the API from the
  // Edge runtime each time. This layout is the one Server Component every
  // public page passes through, and the read behind it is cached and tagged,
  // so the check costs one request per revalidation window instead.
  //
  // `/admin`, `/login` and `/api` sit outside `[locale]` and are untouched —
  // an admin has to stay able to log in and switch this back off.
  const { maintenanceMode, previewAccessEnabled } = await getSiteSettings();

  // The one way past it: a visitor who typed the admin's preview code into
  // the placeholder is carrying an httpOnly cookie, re-checked against the
  // backend here on every render (`lib/maintenance-access.ts`).
  //
  // The *check* stays guarded by `maintenanceMode` — it is a request to the
  // backend, and there is nothing to unlock on an open site. Only the cookie
  // read above is unconditional.
  const previewing = maintenanceMode && (await verifyPreviewCode(previewCode));

  // The chrome (header, footer, WhatsApp button) and `children` are all
  // dropped: the placeholder replaces the site, it does not overlay it, so
  // there is nothing left to navigate to or scroll past.
  //
  // The counters are the one thing that survives. Somebody arriving at a closed
  // site is precisely the number worth having while it is closed — how much
  // traffic the domain already gets, and where from — and dropping it would
  // mean the whole closed period is simply missing from the reports afterwards.
  // `maintenance` labels those visits so they can be told apart from visits to
  // the real site later; see `Analytics`.
  //
  // No JSON-LD here, unlike the branch below: the placeholder is `noindex` and
  // describes no business. Structured data on a page a crawler is told to
  // ignore is markup with no reader.
  if (maintenanceMode && !previewing) {
    return (
      <html
        lang={htmlLang(locale)}
        className={`${montserrat.variable} ${chakraPetch.variable} h-full antialiased`}
      >
        <body className="min-h-full">
          <AnalyticsNoScript
            yandexMetrikaId={seoConfig.analytics.yandexMetrika}
            googleTagManagerId={seoConfig.analytics.googleTagManager}
          />
          <Analytics
            yandexMetrikaId={seoConfig.analytics.yandexMetrika}
            googleTagManagerId={seoConfig.analytics.googleTagManager}
            googleAnalyticsId={seoConfig.analytics.googleAnalytics}
            maintenance
          />
          <script dangerouslySetInnerHTML={{ __html: TOUCH_ACTIVE_SHIM }} />
          <NextIntlClientProvider>
            <MaintenanceScreen previewEnabled={previewAccessEnabled} />
          </NextIntlClientProvider>
        </body>
      </html>
    );
  }

  // The header's «Продукция» panel. Read here, in the one Server Component
  // every page passes through, because `Header` is a client component and
  // `lib/products.ts` is server-only. The fetch is tagged and revalidated by
  // the admin panel's mutations, so this costs one cached request per locale
  // rather than one per navigation.
  const productCategories = await getProductsMenu(locale);

  // Structured data and the analytics counters, both driven by
  // `lib/seo-config.ts` like the metadata above. They live in the layout
  // because they describe the site rather than any one page: emitting the
  // organisation graph once, with a stable `@id`, is what lets the product and
  // article graphs on the pages below point at it instead of restating the
  // publisher on every URL.
  const [organization, website] = await Promise.all([
    buildOrganizationJsonLd(locale),
    buildWebSiteJsonLd(locale),
  ]);

  return (
    <html
      lang={htmlLang(locale)}
      className={`${montserrat.variable} ${chakraPetch.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
        {/* First child of <body>, where Google Tag Manager's fallback frame
            has to live — see `AnalyticsNoScript`. */}
        <AnalyticsNoScript
          yandexMetrikaId={seoConfig.analytics.yandexMetrika}
          googleTagManagerId={seoConfig.analytics.googleTagManager}
        />
        <script dangerouslySetInnerHTML={{ __html: TOUCH_ACTIVE_SHIM }} />
        <JsonLd data={[organization, website]} />
        <Analytics
          yandexMetrikaId={seoConfig.analytics.yandexMetrika}
          googleTagManagerId={seoConfig.analytics.googleTagManager}
          googleAnalyticsId={seoConfig.analytics.googleAnalytics}
        />
        <NextIntlClientProvider>
          <a
            href="#top"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-control focus:bg-brand-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-white focus:shadow-lg"
          >
            {t("skipToContent")}
          </a>
          <Header productCategories={productCategories} />
          <main id="top" className="flex-1">
            {children}
          </main>
          <Footer />
          <WhatsAppFab />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
