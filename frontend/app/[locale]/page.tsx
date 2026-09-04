import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buildPageMetadata } from "@/lib/page-metadata";
import { SEO_PAGE_PATHS } from "@/lib/seo";
import { AboutStatsSection } from "@/components/sections/about-stats-section";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { HeroSection } from "@/components/sections/hero-section";
import { NewsSection } from "@/components/sections/news-section";
import { PartnersSection } from "@/components/sections/partners-section";
import { ProductsGridSection } from "@/components/sections/products-grid-section";
import { ShowroomsSection } from "@/components/sections/showrooms-section";
import { getAboutContent } from "@/lib/about";
import { getHeroSlides } from "@/lib/hero-slides";
import { getShowrooms } from "@/lib/showrooms";

/**
 * The homepage, recomposed on 2026-08-13 against imzo.uz at the client's
 * request.
 *
 * The order is a funnel, and every block earns its place in it:
 *
 *   hero      — the promise and the four audiences.
 *   products  — the catalogue itself, eight photographs, no menu required.
 *   about     — who is behind it: two sentences and four numbers.
 *   news      — dated, because a site with no dates on it looks abandoned.
 *   partners  — the suppliers' marks, an argument the visitor already trusts.
 *   showrooms — the map: which city, and whether it is the visitor's own.
 *   contacts  — where we are, and the form, in one screen.
 *
 * Showrooms sit immediately before contacts on purpose: it answers "can I come
 * and look at it" while the form that asks "shall we call you" is the next
 * thing on the screen.
 *
 * ⚠️ Four sections came off in the same pass: "Линейка систем", "Применения",
 * "Объекты" and "Производство и масштаб". The first two are answered by the
 * products strip in a fraction of the height; the numbers moved into
 * "О компании"; the suppliers' strip became `PartnersSection`. The objects now
 * live at `/products`, which the offers tabs link to.
 */
/**
 * The homepage had no `generateMetadata` of its own — it inherited the layout's
 * `meta.title`/`meta.description` and that was the whole of its `<head>`. It
 * needs one now for the parts the layout cannot supply: the canonical, the
 * four-language alternates cluster, and the admin's overrides for the one page
 * that gets more search traffic than the other five combined.
 */
export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return buildPageMetadata({
    locale,
    path: SEO_PAGE_PATHS.home,
    pageKey: "home",
    title: t("title"),
    description: t("description"),
    // `meta.title` is already «ROLLER — Профильные системы…»; the layout's
    // `%s | ROLLER` template on top of it would say the brand twice.
    absoluteTitle: true,
  });
}

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const heroSlides = await getHeroSlides(locale);
  const showrooms = await getShowrooms(locale);
  const aboutContent = await getAboutContent(locale);

  return (
    // `isolate` is what makes the watermark work. It opens a stacking context,
    // so the `-z-10` layer below sits under every section but still *above* the
    // white on `<body>` — without it the mark would be painted behind the page
    // background and never seen. The sections are translucent for the same
    // reason (see `HomeSection` in `home-kit.tsx`).
    <div className="relative isolate">
      {/* ⚠️ Parked at the client's request on 2026-08-14, not deleted — the
          asset (`public/home/backdrop.svg`) and the two changes that make it
          visible are still in place, so uncommenting this block is the whole of
          switching it back on:

            • `HomeSection` in `home-kit.tsx` paints no solid background —
              `surface` is transparent and `muted` is a 75% wash — so that the
              mark can show through. Without the mark those tones look the same
              as solid white and solid grey, because the page behind them is
              white either way.
            • `<footer>` carries `relative z-10` so the mark cannot ride over
              it. Harmless on its own.

          The brand mark, quietly, down the right edge of the whole page.
          `fixed` rather than `absolute` on purpose: the client asked for one
          background across the homepage, not a shape that scrolls past once.

          35vw sits in the middle of the 30–40% the brief allows and is a plain
          value rather than a clamp, because `clamp(30vw, 35vw, 40vw)` collapses
          to 35vw at every width anyway — all three terms scale together.

      <div
        aria-hidden
        className="pointer-events-none fixed top-1/2 right-0 -z-10 w-[35vw] -translate-y-1/2 opacity-70"
      >
        {/* Not `next/image`: an SVG has no pixels to optimise, and the loader
            would only add a round trip to hand back the same 8 KB file. * /}
        {/* eslint-disable-next-line @next/next/no-img-element * /}
        <img src="/home/backdrop.svg" alt="" className="h-auto w-full" />
      </div>
      */}

      <HeroSection slides={heroSlides} />
      <ProductsGridSection />
      <AboutStatsSection
        title={aboutContent?.homeTitle ?? null}
        body={aboutContent?.homeDescription ?? null}
        stats={aboutContent?.stats ?? []}
      />
      <NewsSection />
      <PartnersSection />
      <ShowroomsSection showrooms={showrooms} />
      <ContactsLeadSection />
    </div>
  );
}
