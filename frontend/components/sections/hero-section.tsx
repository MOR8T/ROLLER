"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { PillLink } from "@/components/sections/home-kit";
import { Container } from "@/components/ui/container";
import { ExpoSlider } from "@/components/ui/expo-slider";
import type { HeroSlideDto } from "@/lib/hero-slides";

/**
 * The first screen: the client's four banners, one line and one action each.
 *
 * The carousel is a documented override of DESIGN.md §2 — see the `HeroSlide`
 * type — but §5 survives it intact and shapes the rest: the deck sits inside
 * `Container` rather than going full-bleed, and it is short enough that the
 * brand lineup's top edge stays visible without scrolling. Hence the tight
 * vertical padding below, and hence no subtext: the old hero's three-line
 * paragraph would have cost the fold on its own.
 *
 * Copy sits along the *bottom* edge because the banners already carry the
 * ROLLER mark and the red/black corner graphics in their own pixels. Anything
 * placed up top would collide with a logo we cannot move.
 *
 * ⚠️ The slider itself moved to `components/ui/expo-slider.tsx` on 2026-08-20,
 * when the product page's showroom band asked for the same motion. The parallax,
 * the seamless loop, the mouse dragging and the autoplay all live there now and
 * are documented there; this file is the homepage's *content* — which banners,
 * which copy, which shapes.
 *
 * ⚠️ Slides moved from the static `heroSlides` fixture to the admin panel on
 * 2026-08-24 (`lib/hero-slides.ts` fetches them; `app/[locale]/page.tsx`
 * fetches once and passes them down as `slides`). They come back in Russian
 * only — there is no `hero.slides.*` per-locale lookup for admin-authored
 * content — and carry no separate button label, so every slide shares the
 * generic `products.more` translation for its pill instead of its own
 * `hero.slides.*.cta`. The static fixture and its full per-locale copy still
 * exist as the fallback for when the backend has nothing yet.
 */

/** Long enough to read a four-word headline and reach for the button. */
const AUTOPLAY_MS = 3500;

interface HeroSectionProps {
  slides: HeroSlideDto[];
}

export function HeroSection({ slides }: HeroSectionProps) {
  const t = useTranslations("hero");
  const tProducts = useTranslations("products");

  return (
    <section
      id="hero"
      aria-label={t("aria")}
      aria-roledescription="carousel"
      // Not `py-section`: the header is already directly above, and the full
      // rhythm here is what would push the next section past the fold.
      // No background of its own: the homepage carries a watermark down its
      // right edge (`page.tsx`) and an opaque section would paint over it.
      className="border-b border-brand-black/8 py-6 sm:py-8 lg:py-10"
    >
      <Container>
        <ExpoSlider
          slides={slides.map((slide, index) => ({
            key: String(slide.id),
            image: slide.imageSrc,
            alt: slide.title,
            // Admin-uploaded photos are absolute URLs into the backend;
            // `next/image`'s optimizer runs server-side and can't reach that
            // URL from inside the container — see `ExpoSlide.unoptimized`.
            unoptimized: slide.imageSrc.startsWith("http"),
            // Only the opening banner is LCP-eligible; the other three are
            // off-screen and must not compete for the connection.
            priority: index === 0,
            content: ({ active, clone, index: real }) => (
              <div className="max-w-2xl p-6 sm:p-8 lg:p-12">
                {/* `heading`, not an index test: the trailing clone is also the
                    first banner, and letting it decide for itself would put a
                    second `<h1>` on the page. */}
                <SlideHeadline heading={real === 0 && !clone}>{slide.title}</SlideHeadline>

                {/* White pill on the photograph — the homepage's own action
                    shape. `ButtonLink` still serves every other page. */}
                <PillLink
                  href={slide.productLink}
                  tone="white"
                  className="mt-7 lg:mt-8"
                  // An off-screen slide is not a tab stop. Without this the deck
                  // buries three more CTAs in the tab order and reaching the
                  // header's next link means passing all of them.
                  tabIndex={active ? undefined : -1}
                >
                  {tProducts("more")}
                  <ArrowRight className="size-4 shrink-0" />
                </PillLink>
              </div>
            ),
          }))}
          labels={{
            previous: t("previous"),
            next: t("next"),
            goTo: (index) => t("goTo", { index }),
            slide: (index, total) => t("slideOf", { index, total }),
          }}
          // Every frame is wider than the 4:5 banners, so `cover` always trims
          // them top and bottom — and that is deliberate. The banners carry a
          // ROLLER mark along their top edge, which the site header is already
          // showing a few pixels higher up; two stacked logos read as a mistake,
          // and a half-clipped one reads as a worse mistake. Square is the
          // loosest crop that clears the mark, which is why the phone does not
          // simply get the banner at its native ratio.
          frameClassName="aspect-square sm:aspect-[4/3] lg:aspect-[16/9]"
          imageSizes="(max-width: 1280px) 125vw, 1520px"
          scrim
          autoplayMs={AUTOPLAY_MS}
          controls="below"
          // `rounded-[1.75rem]`, not `rounded-card`: the homepage runs on its own
          // shape language (`components/sections/home-kit.tsx`) at the client's
          // request, and the deck is the first thing on it.
          className="overflow-hidden rounded-[1.75rem] bg-brand-black"
        />
      </Container>
    </section>
  );
}

/**
 * The page gets exactly one `<h1>`, and it is the first slide's line. Promoting
 * the other three would claim four top-level headings for one screen; demoting
 * them to `<h2>` would file them under the lineup section's own heading in the
 * outline. They are styled headlines, not headings.
 */
function SlideHeadline({ heading, children }: { heading: boolean; children: React.ReactNode }) {
  const className =
    "mt-3 font-heading text-3xl font-bold tracking-tight text-balance text-brand-white drop-shadow-sm sm:text-4xl lg:text-5xl";

  return heading ? (
    <h1 className={className}>{children}</h1>
  ) : (
    <p className={className}>{children}</p>
  );
}
