"use client";

import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { cn } from "@/lib/utils";

// Core only. `swiper/css/pagination` is deliberately left out: it arrives
// unlayered, and unlayered CSS outranks everything in Tailwind's
// `@layer utilities` no matter how specific the utility is — it silently pins
// the active dot back to a circle. Nothing competes once it is gone, so the
// indicator below is plain Tailwind.
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
 * pages with dots.
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

  return (
    <Swiper
      modules={[Autoplay, Pagination, A11y]}
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
        // The strip keeps going after a drag. Stopping for good on first touch
        // is Swiper's default and it makes an autoplaying carousel look broken
        // the moment anyone brushes it.
        disableOnInteraction: false,
        // But it does hold still while the pointer is over it — nobody can read
        // a headline that is sliding away from them.
        pauseOnMouseEnter: true,
      }}
      // ⚠️ Plain bullets, never `dynamicBullets`. That mode scales and shifts
      // the dots through `swiper-pagination-bullet-active-{main,prev,next}`,
      // and every one of those rules lives in `swiper/css/pagination` — the
      // stylesheet this file deliberately does not import, because it arrives
      // unlayered and outranks the Tailwind below. Turning it on without that
      // CSS is what left the dot row misaligned, worst on a narrow screen.
      pagination={{ clickable: true }}
      a11y={{
        // Swiper interpolates `{{index}}` itself, so the placeholder has to
        // survive `next-intl` intact — passing it as the value does that and
        // keeps the sentence, and its word order, in the message catalogue.
        paginationBulletMessage: t("goTo", { index: "{{index}}" }),
        containerRoleDescriptionMessage: t("region"),
        itemRoleDescriptionMessage: t("slide"),
      }}
      aria-label={label}
      // Room below the cards for the dots is inline, not a `pb-*` utility:
      // `swiper/css` ships unlayered and its own `.swiper { padding: 0px }`
      // outranks anything in `@layer utilities` regardless of class order or
      // specificity. Same trap as the slide height in `partners-grid.tsx`.
      style={{ paddingBottom: "3rem" }}
      className={cn(
        // The grab cursor is set here rather than left to `grabCursor`. That
        // option writes `style.cursor` on the root at init, and React blows the
        // inline style away on the next render of this component — measured:
        // `params.grabCursor` was true while `el.style.cursor` was empty. As
        // classes it survives, and `:active` covers the "grabbing" half that
        // Swiper would otherwise swap in on pointerdown.
        "cursor-grab active:cursor-grabbing",
        // Swiper positions the pagination absolutely against the root — so once
        // the root has its own padding, `bottom-0` lands inside that padding,
        // under the strip, rather than over it.
        "[&_.swiper-pagination]:absolute [&_.swiper-pagination]:inset-x-0 [&_.swiper-pagination]:bottom-0 [&_.swiper-pagination]:flex [&_.swiper-pagination]:items-center [&_.swiper-pagination]:justify-center [&_.swiper-pagination]:gap-2",
        // A dot, so `rounded-full` is allowed. Black, not red: the homepage
        // spends its one accent on the news date (`home-kit.tsx`).
        "[&_.swiper-pagination-bullet]:h-2 [&_.swiper-pagination-bullet]:cursor-pointer [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:duration-300 [&_.swiper-pagination-bullet]:focus-visible:ring-2 [&_.swiper-pagination-bullet]:focus-visible:ring-brand-black [&_.swiper-pagination-bullet]:focus-visible:ring-offset-2 [&_.swiper-pagination-bullet]:focus-visible:outline-none",
        // Idle and current are styled through mutually exclusive selectors on
        // purpose. Both set `width` and `background`, and two utilities of the
        // same property leave the winner to stylesheet order — `:not()` makes
        // them incapable of matching the same dot, so the cascade never has to
        // break the tie.
        "[&_.swiper-pagination-bullet:not(.swiper-pagination-bullet-active)]:w-2 [&_.swiper-pagination-bullet:not(.swiper-pagination-bullet-active)]:bg-brand-black/20",
        "[&_.swiper-pagination-bullet:not(.swiper-pagination-bullet-active):hover]:bg-brand-black/45",
        // The current page stretches rather than only changing colour, which
        // survives both a small screen and a colour-blind reading.
        "[&_.swiper-pagination-bullet-active]:w-8 [&_.swiper-pagination-bullet-active]:bg-brand-black",
        className,
      )}
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
  );
}
