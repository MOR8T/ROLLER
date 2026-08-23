"use client";

import { ReactNode, useState } from "react";
import { useTranslations } from "next-intl";
import type SwiperInstance from "swiper";
import { A11y, Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { SliderArrow } from "@/components/ui/slider-arrow";
import { cn } from "@/lib/utils";

// Core only. Neither `swiper/css/pagination` nor Swiper's `Pagination` module
// is here: the dots and arrows below are the site's own controls, the same row
// `expo-slider.tsx` puts under the hero deck. Swiper's pagination stylesheet
// also arrives unlayered, which outranks everything in Tailwind's
// `@layer utilities` no matter how specific the utility is — it used to pin the
// active dot back to a circle. Nothing competes once both are gone.
import "swiper/css";

export interface HomeCarouselSlide {
  key: string;
  node: ReactNode;
}

interface HomeCarouselProps {
  slides: HomeCarouselSlide[];
  /** slidesPerView at base / sm(640) / lg(1024). */
  perView: [number, number, number];
  gap?: number;
  autoplayDelay?: number;
  /** Describes the strip. Usually the section heading. */
  label: string;
  className?: string;
  slideClassName?: string;
}

/**
 * The homepage's carousel: loops, plays itself, drags under the cursor, and
 * steps from a row of dots and arrows under the strip — the same control row
 * `expo-slider.tsx` puts under the hero deck, so every slider on the page is
 * driven the same way.
 *
 * ── Why Swiper and not a scroll-snap track ──────────────────────────────────
 *
 * The news and partner strips used to be native scroll containers, which is the
 * better tool right up to the moment a seamless loop is required. Wrapping a
 * scroll container means cloning the list and rewriting `scrollLeft` at the
 * seam — while a drag may be in flight, while a smooth scroll is still
 * animating, while autoplay is mid-transition. Swiper already solves that and
 * is already in `package.json`.
 *
 * ── The repeat, and why it is not a bug ─────────────────────────────────────
 *
 * Swiper disables `loop` when there are fewer slides than `slidesPerView * 2`
 * and says so in the console ("add more slides (or make duplicates)"). Three
 * news articles three-up on a desktop is exactly that case, so the list is
 * repeated until the loop has material — which is what a loop of three items
 * *is*: the same three going past again. The repeats are `aria-hidden` and out
 * of the tab order, so a screen reader and a crawler still see each item once.
 *
 * The factor is computed, not hardcoded: the moment the client publishes a
 * sixth article through the admin panel it drops to 1 and the repeats vanish.
 */
export function HomeCarousel({
  slides,
  perView,
  gap = 16,
  autoplayDelay = 3500,
  label,
  className,
  slideClassName,
}: HomeCarouselProps) {
  const t = useTranslations("home.carousel");

  const widest = Math.ceil(Math.max(...perView));
  const needed = widest * 2;
  const passes = slides.length >= needed ? 1 : Math.ceil(needed / slides.length);

  const rendered = Array.from({ length: passes }, (_, pass) =>
    slides.map((slide) => ({ ...slide, pass })),
  ).flat();

  /**
   * How many extra slides Swiper keeps buffered on each side of the loop.
   *
   * ⚠️ This number is the difference between a strip that wraps forever and one
   * that stops dead, and both failure modes are one step away on either side.
   * Swiper 14 sizes the buffer as `slidesPerGroup + loopAdditionalSlides`, and
   * with one slide per group the default leaves it at 1. Measured on all three
   * strips, driving `slideNext` twelve times and counting how often the track
   * reported `isEnd` and how many distinct slides it actually visited:
   *
   *   buffer 1  news 6/6 slides but `isEnd` on 10 of 12 steps — the strip is
   *             pinned against its own end and only `realIndex` moves. This is
   *             the bug the client reported.
   *   buffer 2  news 6/6, partners 8/8, products 8/8, `isEnd` never. ✅
   *   buffer 3  same, and the extra room helps the wider strips. ✅
   *   buffer 4  news collapses to 4 of 6 slides; products drops to 7 of 8 and
   *             starts skipping — the buffer has eaten the track.
   *   buffer 5  news freezes on one slide entirely.
   *
   * So: at least two, at most three, and never so large that the buffer plus a
   * screenful leaves fewer than two slides of real track behind it.
   */
  const buffer = Math.max(1, Math.min(2, rendered.length - widest - 2));

  const [baseView, smView, lgView] = perView;

  // The dots count *real* slides, never the repeats: `rendered` may hold the
  // same list two or three times over, and a row of dots that counts copies is
  // a row that lies about how much there is to see.
  const [swiper, setSwiper] = useState<SwiperInstance | null>(null);
  const [active, setActive] = useState(0);

  return (
    <div className={cn("relative", className)}>
      <Swiper
        onSwiper={setSwiper}
        // `realIndex` indexes `rendered`, so a strip that repeats its list
        // reports 5 for the second copy of slide 2 — the modulo folds the
        // copies back onto the slide they duplicate.
        onSlideChange={(instance) => setActive(instance.realIndex % slides.length)}
        modules={[Autoplay, A11y]}
        slidesPerView={baseView}
        // One slide per step everywhere. Paging by a whole screenful makes the
        // autoplay lurch, and it also makes a dot mean "page", which stops being
        // a useful unit the moment the page size changes with the breakpoint.
        slidesPerGroup={1}
        spaceBetween={gap}
        // `grabCursor` is repeated in every breakpoint on purpose. Swiper compares
        // the incoming breakpoint's value against the current one, and an absent
        // key reads as "off" — so crossing 640px would strip the grab cursor and
        // leave a strip that still drags but no longer says it does.
        breakpoints={{
          640: { slidesPerView: smView, grabCursor: true },
          1024: { slidesPerView: lgView, grabCursor: true },
        }}
        loop
        loopAdditionalSlides={buffer}
        grabCursor
        autoplay={{
          delay: autoplayDelay,
          // The strip keeps going after a drag, and after an arrow. Stopping for
          // good on first touch is Swiper's default and it makes an autoplaying
          // carousel look broken the moment anyone brushes it.
          disableOnInteraction: false,
          // But it does hold still while the pointer is over it — nobody can read
          // a headline that is sliding away from them.
          pauseOnMouseEnter: true,
        }}
        a11y={{
          containerRoleDescriptionMessage: t("region"),
          itemRoleDescriptionMessage: t("slide"),
        }}
        aria-label={label}
        // The grab cursor is set here rather than left to `grabCursor`. That
        // option writes `style.cursor` on the root at init, and React blows the
        // inline style away on the next render of this component — measured:
        // `params.grabCursor` was true while `el.style.cursor` was empty. As
        // classes it survives, and `:active` covers the "grabbing" half that
        // Swiper would otherwise swap in on pointerdown.
        className="cursor-grab active:cursor-grabbing"
      >
        {rendered.map((slide) => (
          <SwiperSlide
            key={`${slide.key}-${slide.pass}`}
            // `h-auto`, because `swiper/css` sets `.swiper-slide { height: 100% }`
            // unlayered and a card that has to size itself would collapse.
            style={{ height: "auto" }}
            className={slideClassName}
            aria-hidden={slide.pass > 0 || undefined}
            // A repeat must not be a tab stop, or the keyboard walks the same
            // three links twice.
            inert={slide.pass > 0 || undefined}
          >
            {slide.node}
          </SwiperSlide>
        ))}
      </Swiper>

      {slides.length > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.key}
                type="button"
                aria-label={t("goTo", { index: index + 1 })}
                aria-current={index === active}
                // `slideToLoop` takes a real index and finds whichever copy of
                // it is nearest, so a dot stays one short hop away even on a
                // strip whose list is repeated.
                onClick={() => swiper?.slideToLoop(index)}
                className={cn(
                  // A dot, so `rounded-full` is allowed — DESIGN.md §5 rules out
                  // pills for buttons, not for indicators. The current one
                  // stretches rather than only changing colour, which survives
                  // both a small screen and a colour-blind reading.
                  "h-2 cursor-pointer rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none",
                  index === active
                    ? "w-8 bg-brand-black"
                    : "w-2 bg-brand-black/20 hover:bg-brand-black/40",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* The strip loops, so neither arrow is ever a dead end — no
                disabled state to reach. */}
            <SliderArrow side="left" label={t("previous")} onClick={() => swiper?.slidePrev()} />
            <SliderArrow side="right" label={t("next")} onClick={() => swiper?.slideNext()} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
