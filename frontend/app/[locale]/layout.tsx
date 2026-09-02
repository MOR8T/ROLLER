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
import { routing } from "@/i18n/routing";

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

  // While «Сайт в разработке» is on there is no site to describe, and nothing
  // worth indexing: the tab reads as the placeholder and crawlers are told to
  // stay away, so a search engine that happens to recrawl during the closure
  // does not replace the real listings with it.
  const { maintenanceMode } = await getSiteSettings();
  if (maintenanceMode) {
    const tMaintenance = await getTranslations({ locale, namespace: "maintenance" });
    return { title: tMaintenance("title"), robots: { index: false, follow: false } };
  }

  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  // Opts every Server Component under this layout back into static rendering,
  // which `await params` would otherwise forfeit.
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "common" });

  // «Настройки сайта» → «Сайт в разработке». Gated here rather than in
  // `proxy.ts` because the flag lives in the backend: the proxy runs on every
  // request, including static assets, and would have to reach the API from the
  // Edge runtime each time. This layout is the one Server Component every
  // public page passes through, and the read behind it is cached and tagged,
  // so the check costs one request per revalidation window instead.
  //
  // `/admin`, `/login` and `/api` sit outside `[locale]` and are untouched —
  // an admin has to stay able to log in and switch this back off.
  const { maintenanceMode } = await getSiteSettings();

  // The chrome (header, footer, WhatsApp button) and `children` are all
  // dropped: the placeholder replaces the site, it does not overlay it, so
  // there is nothing left to navigate to or scroll past.
  if (maintenanceMode) {
    return (
      <html
        lang={locale}
        className={`${montserrat.variable} ${chakraPetch.variable} h-full antialiased`}
      >
        <body className="min-h-full">
          <NextIntlClientProvider>
            <MaintenanceScreen />
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

  return (
    <html
      lang={locale}
      className={`${montserrat.variable} ${chakraPetch.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
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
