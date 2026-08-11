"use client";

import { useTranslations } from "next-intl";
import { A11y, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { partners } from "@/data/home";
import { cn } from "@/lib/utils";

// Core only. `swiper/css/pagination` is deliberately left out: it arrives
// unlayered, and unlayered CSS outranks everything in Tailwind's
// `@layer utilities` no matter how specific the utility is — it silently pins
// the active dot back to a circle. Nothing competes once it is gone, so the
// indicator below is plain Tailwind.
import "swiper/css";

/**
 * The suppliers' marks: Krauss Maffei, Renolit, Mikrosan, Akdeniz and the rest
 * (brief §7.4). Shown on the homepage's production block and on `/about`.
 *
 * ── Why Swiper here and nowhere else ────────────────────────────────────────
 *
 * `product-gallery.tsx` and `hero-section.tsx` both drive their strips with a
 * native scroll-snap track and say so in their own comments: the browser hands
 * them momentum, rubber-band and snapping for nothing. This one loops, and a
 * loop is the one thing that approach cannot give. Seamless wrap on a scroll
 * container means cloning the list and silently rewriting `scrollLeft` at the
 * seam — while a drag may be in flight, while a smooth scroll is still
 * animating. Swiper already solves that, it is already in `package.json`, and
 * this is the first place on the site that actually needs it.
 *
 * No arrows by request: the pointer drags (`grabCursor`) and the dots page. The
 * dots are Swiper's own so the page arithmetic stays Swiper's — with `loop` and
 * a group size that tracks the breakpoint, counting pages by hand is exactly
 * the bookkeeping this component switched libraries to avoid. They are restyled
 * to the hero's indicator instead: a red bar for the current page, grey dots for
 * the rest, stretched rather than only recoloured so the state survives a
 * colour-blind reading.
 */
export function PartnersGrid({ className }: { className?: string }) {
  const t = useTranslations("partners");

  return (
    <Swiper
      modules={[Pagination, A11y]}
      // One row of cards, two on a phone and four from `md` — the same counts
      // the static grid used, so the block keeps its rhythm on both pages that
      // render it. Paging by a whole screenful rather than one card is what
      // makes a dot mean "page" instead of "logo".
      slidesPerView={2}
      slidesPerGroup={2}
      spaceBetween={12}
      // `grabCursor` is repeated here on purpose. Swiper compares the incoming
      // breakpoint's value against the current one, and an absent key reads as
      // "off" — so crossing 768px would strip the grab cursor and leave a strip
      // that still drags but no longer says it does.
      breakpoints={{ 768: { slidesPerView: 4, slidesPerGroup: 4, grabCursor: true } }}
      loop
      grabCursor
      pagination={{ clickable: true }}
      a11y={{
        // Swiper interpolates `{{index}}` itself, so the placeholder has to
        // survive `next-intl` intact — passing it as the value does that and
        // keeps the sentence, and its word order, in the message catalogue.
        paginationBulletMessage: t("goTo", { index: "{{index}}" }),
        containerRoleDescriptionMessage: t("carousel"),
        itemRoleDescriptionMessage: t("slide"),
      }}
      aria-label={t("aria")}
      wrapperTag="ul"
      // Room below the cards for the dots is inline, not a `pb-8` utility:
      // `swiper/css` ships unlayered and its own `.swiper { padding: 0px }`
      // outranks anything in `@layer utilities` regardless of class order or
      // specificity — the same trap the slide height hit below. Without it the
      // root has no space of its own, and the dots (`bottom-0` inside a
      // `overflow: hidden` box) sit on top of the cards' own bottom edge
      // instead of in a row beneath them.
      style={{ paddingBottom: "2rem" }}
      className={cn(
        // Swiper positions the pagination absolutely against the root — so
        // once the root has its own padding, `bottom-0` lands inside that
        // padding, under the strip, rather than over it.
        "[&_.swiper-pagination]:absolute [&_.swiper-pagination]:inset-x-0 [&_.swiper-pagination]:bottom-0 [&_.swiper-pagination]:flex [&_.swiper-pagination]:items-center [&_.swiper-pagination]:justify-center [&_.swiper-pagination]:gap-2",
        // A dot, so `rounded-full` is allowed — DESIGN.md §5 rules out pills for
        // buttons, not for indicators.
        "[&_.swiper-pagination-bullet]:h-2 [&_.swiper-pagination-bullet]:cursor-pointer [&_.swiper-pagination-bullet]:rounded-full [&_.swiper-pagination-bullet]:transition-all [&_.swiper-pagination-bullet]:duration-300 [&_.swiper-pagination-bullet]:focus-visible:ring-2 [&_.swiper-pagination-bullet]:focus-visible:ring-brand-red [&_.swiper-pagination-bullet]:focus-visible:ring-offset-2 [&_.swiper-pagination-bullet]:focus-visible:outline-none",
        // The idle and current dots are styled through mutually exclusive
        // selectors on purpose. Both set `width` and `background`, and two
        // utilities of the same property leave the winner to stylesheet order —
        // `:not()` makes them incapable of matching the same dot, so the cascade
        // never has to break the tie.
        "[&_.swiper-pagination-bullet:not(.swiper-pagination-bullet-active)]:w-2 [&_.swiper-pagination-bullet:not(.swiper-pagination-bullet-active)]:bg-brand-black/20",
        "[&_.swiper-pagination-bullet:not(.swiper-pagination-bullet-active):hover]:bg-brand-black/40",
        // The current page stretches rather than only changing colour, which
        // survives both a small screen and a colour-blind reading.
        "[&_.swiper-pagination-bullet-active]:w-8 [&_.swiper-pagination-bullet-active]:bg-brand-red",
        className,
      )}
    >
      {partners.map((partner) => (
        <SwiperSlide
          key={partner.name}
          tag="li"
          // Height is inline, not a `h-24` utility, because `swiper/css` ships
          // unlayered and its own `.swiper-slide { height: 100% }` outranks
          // anything in Tailwind's `@layer utilities` regardless of class order
          // or specificity — the same trap the pagination dots hit above. An
          // inline style is the one thing that reliably wins over a stylesheet
          // rule short of `!important`.
          //
          // The fixed height itself is why this exists at all: with only a
          // minimum, each slide took its own logo's own height, and the marks
          // arrive at every aspect ratio from a wide wordmark to a near-square
          // globe icon — 96px next to 180px in the same row. `object-contain`
          // below is the other half, scaling each logo down to fit instead of
          // cropping it.
          style={{ height: "6rem" }}
          className="flex items-center justify-center overflow-hidden rounded-card border border-brand-black/10 bg-surface p-4"
        >
          {partner.logo ? (
            // Deliberately not `next/image`: these are eight small, fixed marks
            // that never change size, so the loader would cost a round trip per
            // logo to hand back what is already the right file.
            <img
              src={partner.logo}
              alt={partner.name}
              className="max-h-full max-w-full mx-auto object-contain"
            />
          ) : (
            // A partner without a mark falls back to its name set in type,
            // exactly like the two aluminium brands do in the catalog.
            <span className="text-center font-heading text-sm font-semibold text-brand-black/70">
              {partner.name}
            </span>
          )}
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
