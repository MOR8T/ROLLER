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
        // Swiper decides "swipe or page scroll" on the first move of a gesture
        // and holds that decision for the whole of it. At the default 45° a
        // diagonal flick — which is most of them, on a card this tall (`aspect-4/5`
        // at 78vw on a phone) — is read as a scroll and the strip sits still
        // until the finger lifts. 60° keeps a deliberate vertical scroll working
        // and stops eating the sloppy horizontal ones.
        touchAngle={60}
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
            // `select-none` and the killed `dragstart` are one fix, the same one
            // `expo-slider.tsx` and `product-gallery-section.tsx` already carry:
            // a slide here is a `<Link>` around a photograph, and both an anchor
            // and an `<img>` are draggable by default. Swiper only guards that
            // with `preventDefault()` on `pointerdown`, which Firefox and Safari
            // ignore for drag purposes — so the browser walked off with a ghost
            // of the picture instead of moving the strip.
            //
            // ⚠️ And the ghost did not just cost that one gesture. Starting a
            // native drag fires `pointercancel`, and Swiper's `onTouchEnd`
            // returns on it before clearing `pointerId`/`isTouched`/`isMoved`
            // unless the browser is Safari or a WebView — after which its
            // `onTouchStart` bails on `isTouched && isMoved` and the strip is
            // undraggable until the component remounts. One stray drag on a
            // photo killed the mouse for the rest of the visit.
            //
            // The handler goes on the slide, not on `<Swiper>`: swiper-react
            // reads any `on[A-Z]` function prop as a *Swiper event* name, so
            // `onDragStart` there would quietly become an event called
            // `dragStart` and never reach the DOM. `dragstart` bubbles, so one
            // handler per slide covers the card and the photograph both.
            onDragStart={(event) => event.preventDefault()}
            className={cn("select-none", slideClassName)}
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
          {/* Padded hit areas, exactly as in `expo-slider.tsx` — see the note
              there. The dots' own geometry is unchanged.

              ⚠️ `min-w-0 flex-wrap` is what stops a long pager from widening
              the page: the strips take as many dots as the admin has rows, and
              `/about`'s fourteen certificates need 248px next to a 96px pair of
              arrows — more than the 328px gutter-to-gutter of a 360px phone,
              which is most Android screens here. Without it the row could not
              shrink below its content and `<html>` grew to 368px, so the whole
              page scrolled sideways. Wrapping is the same answer
              `product-gallery-section.tsx` already gives its own pager. */}
          <div className="-mx-1 flex min-w-0 flex-wrap items-center gap-0">
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
                className="group flex h-11 cursor-pointer items-center px-1 focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span
                  aria-hidden
                  className={cn(
                    // A dot, so `rounded-full` is allowed — DESIGN.md §5 rules out
                    // pills for buttons, not for indicators. The current one
                    // stretches rather than only changing colour, which survives
                    // both a small screen and a colour-blind reading.
                    "block h-2 rounded-full transition-all duration-300",
                    index === active
                      ? "w-8 bg-brand-black"
                      : "w-2 bg-brand-black/20 group-hover:bg-brand-black/40",
                  )}
                />
              </button>
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
