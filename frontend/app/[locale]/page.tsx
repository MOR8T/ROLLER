import { setRequestLocale } from "next-intl/server";
import { AboutStatsSection } from "@/components/sections/about-stats-section";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { HeroSection } from "@/components/sections/hero-section";
import { MeasureStripSection } from "@/components/sections/measure-strip-section";
import { NewsSection } from "@/components/sections/news-section";
import { OffersTabsSection } from "@/components/sections/offers-tabs-section";
import { PartnersSection } from "@/components/sections/partners-section";
import { ProductsGridSection } from "@/components/sections/products-grid-section";

/**
 * The homepage, recomposed on 2026-08-13 against imzo.uz at the client's
 * request.
 *
 * The order is a funnel, and every block earns its place in it:
 *
 *   hero      — the promise and the four audiences.
 *   products  — the catalogue itself, eight photographs, no menu required.
 *   measure   — one field, halfway down, for the visitor who is already sold.
 *   about     — who is behind it: two sentences and four numbers.
 *   offers    — three audiences, three sets of pages written for them.
 *   news      — dated, because a site with no dates on it looks abandoned.
 *   partners  — the suppliers' marks, an argument the visitor already trusts.
 *   contacts  — where we are, and the form, in one screen.
 *
 * ⚠️ Four sections came off in the same pass: "Линейка систем", "Применения",
 * "Объекты" and "Производство и масштаб". The first two are answered by the
 * products strip in a fraction of the height; the numbers moved into
 * "О компании"; the suppliers' strip became `PartnersSection`. The objects now
 * live at `/products`, which the offers tabs link to.
 */
export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

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

      <HeroSection />
      <ProductsGridSection />
      <MeasureStripSection />
      <AboutStatsSection />
      <OffersTabsSection />
      <NewsSection />
      <PartnersSection />
      <ContactsLeadSection />
    </div>
  );
}
