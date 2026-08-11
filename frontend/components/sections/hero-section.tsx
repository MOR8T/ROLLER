"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { heroSlides } from "@/data/home";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

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
 * ── The motion ──────────────────────────────────────────────────────────────
 *
 * Modelled on uiinitiative's Expo Slider. Three layers move against each other,
 * driven by how far a slide sits from the centre (`progress`: 0 active, ±1 one
 * slide out):
 *
 *   frame    scale 1 → 1.25, anchored to the edge facing the active slide
 *   image    counter-translates ∓50% and scales 1 → 1.125, plus grayscale
 *   content  slides ∓100% and fades out by the halfway point
 *
 * The image is 125% of the frame's width (`-left-[12.5%] w-[125%]`), which is
 * what gives the counter-translation somewhere to go without exposing an edge.
 * That opposition *is* the parallax: the frame zooms, the picture inside holds
 * still, and the neighbour reads as a crop of a larger photograph rather than
 * as a smaller copy of the same one.
 *
 * Swiper drives the original; here the track is the same scroll-snap strip
 * `product-gallery.tsx` uses, and `progress` is read off `scrollLeft`. Touch
 * therefore keeps the browser's own momentum and rubber-band for zero bytes,
 * and the arrows, dots and autoplay all just `scrollTo` the one element. The
 * per-frame styles are written imperatively rather than through state: at 60fps
 * a `setState` per layer per slide would re-render the whole deck for values
 * React never needs to know about.
 */

/** Long enough to read a four-word headline and reach for the button. */
const AUTOPLAY_MS = 7000;

/** Frame zoom for a neighbour, matching the reference's `scale(1.25)`. */
const FRAME_ZOOM = 0.25;

/**
 * Image counter-zoom. Deliberately *not* the frame's: the picture has to lag
 * behind its own frame, and matching the two would cancel the parallax out.
 */
const IMAGE_ZOOM = 0.125;

/**
 * How far the mouse has to travel before a press becomes a drag. Below this a
 * press is still a click, so the CTA underneath keeps working — a slider that
 * eats the button it is advertising is worse than one that does not drag.
 */
const DRAG_THRESHOLD = 8;

/**
 * Fraction of the track a drag must cover to turn the page. Well under half:
 * the gesture people actually make is a short flick, and demanding 50% means a
 * flick springs back and reads as a dead slider.
 */
const DRAG_COMMIT = 0.15;

/**
 * Hands snapping back after a drag. Snapping has to stay off until the release
 * animation lands: restoring `scroll-snap-type` mid-flight makes the browser
 * re-snap to whatever is nearest *now*, which on a 15–50% drag is the slide
 * being left rather than the one being chosen.
 *
 * `scrollend` is the precise signal and the timeout is the floor, because
 * Safari only shipped the event recently and a stuck-off snap would cost every
 * later touch swipe its paging.
 */
function restoreSnapAfterScroll(element: HTMLElement) {
  let timer = 0;

  const restore = () => {
    element.style.scrollSnapType = "";
    element.removeEventListener("scrollend", restore);
    window.clearTimeout(timer);
  };

  element.addEventListener("scrollend", restore, { once: true });
  timer = window.setTimeout(restore, 700);
}

export function HeroSection() {
  const t = useTranslations("hero");

  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const paint = useCallback(() => {
    const element = track.current;
    if (!element) return;

    const width = element.clientWidth;
    if (!width) return;

    // Scroll-linked movement is still movement. Under `prefers-reduced-motion`
    // the deck keeps working and keeps paging — it simply stops zooming.
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (let index = 0; index < element.children.length; index += 1) {
      const slide = element.children[index] as HTMLElement;
      const layer = (name: string) => slide.querySelector<HTMLElement>(`[data-expo="${name}"]`);

      const picture = layer("image");
      const content = layer("content");
      const box = layer("frame");
      if (!box || !picture || !content) continue;

      // +1 = one slide to the right of centre, −1 = one to the left. Clamped,
      // so slides further out than a neighbour hold the neighbour's pose
      // instead of inflating without bound.
      const progress = Math.max(-1, Math.min(1, (index * width - element.scrollLeft) / width));
      const away = Math.abs(progress);

      // Anchor the zoom to the edge the active slide is on, so the neighbour
      // grows *away* from centre and the seam between the two never gapes.
      box.style.transformOrigin = progress > 0 ? "left center" : "right center";
      box.style.transform = still ? "" : `scale(${1 + FRAME_ZOOM * away})`;

      picture.style.transformOrigin = progress > 0 ? "right center" : "left center";
      picture.style.transform = still
        ? ""
        : `translateX(${-progress * 50}%) scale(${1 + IMAGE_ZOOM * away})`;
      picture.style.filter = `grayscale(${away})`;

      content.style.transform = still ? "" : `translateX(${-progress * 100}%)`;
      // Gone by the halfway mark: copy legible over two photographs at once is
      // copy legible over neither.
      content.style.opacity = `${1 - 2 * away}`;
    }

    const next = Math.round(element.scrollLeft / width);
    setActive((current) => (current === next ? current : next));
  }, []);

  // One paint per frame at most. A scroll can fire several events per frame and
  // every one of them would otherwise walk all four slides.
  const schedulePaint = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
  }, [paint]);

  useEffect(() => {
    const element = track.current;
    if (!element) return;

    paint();

    // Every transform above is expressed in the track's own width, so a resize
    // invalidates all of them at once — including the breakpoint changes that
    // reshape the frame from portrait to widescreen.
    const observer = new ResizeObserver(schedulePaint);
    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [paint, schedulePaint]);

  const scrollToSlide = useCallback((index: number, wrap = true) => {
    const element = track.current;
    if (!element) return;

    // Controls wrap; a drag clamps. For the arrows a dead "next" on the last
    // slide reads as a broken button, but a drag past the end that teleports
    // back to the first slide reads as the deck losing its place — the hand is
    // already at the edge and expects the resistance.
    const target = wrap
      ? (index + heroSlides.length) % heroSlides.length
      : Math.max(0, Math.min(heroSlides.length - 1, index));

    element.scrollTo({ left: target * element.clientWidth, behavior: "smooth" });
  }, []);

  /**
   * Mouse dragging.
   *
   * Touch and pen already page this deck — the track is a scroll container and
   * the browser gives them momentum, rubber-band and snapping for free, none of
   * which this can reproduce. The mouse is the pointer with no gesture at all,
   * so it is the only one intercepted here; `pointerType` is the whole guard.
   *
   * Dragging writes `scrollLeft` directly, which means the parallax above keeps
   * being driven by the same `scroll` events and follows the cursor live rather
   * than animating only on release.
   */
  const drag = useRef<{
    pointer: number;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);

  /** Set when a press turned out to be a drag, so its trailing click is not a click. */
  const dragged = useRef(false);

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;

    const element = track.current;
    if (!element) return;

    dragged.current = false;
    drag.current = {
      pointer: event.pointerId,
      startX: event.clientX,
      startScroll: element.scrollLeft,
      moved: false,
    };
  }

  function moveDrag(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const element = track.current;
    if (!state || !element || event.pointerId !== state.pointer) return;

    const travelled = event.clientX - state.startX;

    if (!state.moved) {
      if (Math.abs(travelled) < DRAG_THRESHOLD) return;
      state.moved = true;
      dragged.current = true;

      // Capture so a fast drag that leaves the card still steers it, and turn
      // snapping off: it would haul every assignment below back to the nearest
      // slide mid-gesture.
      //
      // Capture is the nicety, not the mechanism — it throws `InvalidPointerId`
      // if the pointer is already gone, and an exception here would take the
      // rest of the drag with it. Losing capture only costs a gesture that
      // wanders off the card.
      try {
        element.setPointerCapture(state.pointer);
      } catch {
        // no capture; the drag still tracks while the cursor is over the deck
      }

      element.style.scrollSnapType = "none";
    }

    element.scrollLeft = state.startScroll - travelled;
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const element = track.current;
    if (!state || !element || event.pointerId !== state.pointer) return;

    drag.current = null;
    if (element.hasPointerCapture(state.pointer)) element.releasePointerCapture(state.pointer);

    // Never crossed the threshold, so nothing was disturbed and the press is
    // still on its way to whatever was underneath it.
    if (!state.moved) return;

    const travelled = event.clientX - state.startX;
    const from = Math.round(state.startScroll / element.clientWidth);
    const committed = Math.abs(travelled) > element.clientWidth * DRAG_COMMIT;

    scrollToSlide(from + (committed ? -Math.sign(travelled) : 0), false);
    restoreSnapAfterScroll(element);
  }

  useEffect(() => {
    if (paused || heroSlides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      const element = track.current;
      if (!element) return;

      // Read the position off the element rather than off `active`: the effect
      // must not re-subscribe on every advance, or the interval restarts each
      // time and one slide silently gets a double beat.
      const current = Math.round(element.scrollLeft / element.clientWidth);
      element.scrollTo({
        left: ((current + 1) % heroSlides.length) * element.clientWidth,
        behavior: "smooth",
      });
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section
      id="hero"
      aria-label={t("aria")}
      aria-roledescription="carousel"
      // Not `py-section`: the header is already directly above, and the full
      // rhythm here is what would push the next section past the fold.
      className="border-b border-brand-black/8 bg-surface py-6 sm:py-8 lg:py-10"
    >
      <Container>
        <div
          className="overflow-hidden rounded-card bg-brand-black"
          // Pause on hover *and* on focus: a keyboard visitor tabbing to the CTA
          // has no pointer to hover with, and having the slide scroll out from
          // under the focused button is the worst version of this.
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div
            ref={track}
            onScroll={schedulePaint}
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            // The click that closes a drag has to die here, or letting go over
            // the CTA navigates away from a page the visitor was only browsing.
            // Capture phase, so it never reaches the link at all.
            onClickCapture={(event) => {
              if (!dragged.current) return;
              dragged.current = false;
              event.preventDefault();
              event.stopPropagation();
            }}
            // Otherwise the browser's own image drag starts instead of ours and
            // the cursor walks off with a ghost of the banner.
            onDragStart={(event) => event.preventDefault()}
            // `overflow-y-hidden` is load-bearing, not tidiness: a neighbour at
            // scale 1.25 overflows the frame vertically, and leaving that axis
            // `visible` would both spill it over the header and hand the track
            // a vertical scrollbar it has no use for.
            //
            // `select-none` is part of dragging: without it the gesture paints
            // the headline blue instead of moving the deck.
            className="flex cursor-grab snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overflow-y-hidden select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
          >
            {heroSlides.map((slide, index) => (
              <div
                key={slide.key}
                role="group"
                aria-roledescription="slide"
                aria-label={t("slideOf", { index: index + 1, total: heroSlides.length })}
                className="w-full shrink-0 snap-center"
              >
                <div
                  data-expo="frame"
                  // Every frame is wider than the 4:5 banners, so `cover` always
                  // trims them top and bottom — and that is deliberate. The
                  // banners carry a ROLLER mark along their top edge, which the
                  // site header is already showing a few pixels higher up; two
                  // stacked logos read as a mistake, and a half-clipped one
                  // reads as a worse mistake. Square is the loosest crop that
                  // clears the mark, which is why the phone does not simply get
                  // the banner at its native ratio.
                  className="relative aspect-square w-full overflow-hidden will-change-transform sm:aspect-[4/3] lg:aspect-[16/9]"
                >
                  <div
                    data-expo="image"
                    // 125% wide and pulled half the excess to the left, so the
                    // counter-translation has somewhere to travel and never
                    // walks an edge into frame.
                    className="absolute inset-y-0 -left-[12.5%] w-[125%] will-change-transform"
                  >
                    <Image
                      src={slide.image}
                      alt={t(`slides.${slide.key}.imageLabel`)}
                      fill
                      className="object-cover"
                      // Only the opening banner is LCP-eligible; the other
                      // three are off-screen and must not compete for the
                      // connection.
                      priority={index === 0}
                      sizes="(max-width: 1280px) 125vw, 1520px"
                    />
                  </div>

                  {/* Scrim, not decoration: white copy over a sunset facade is
                      unreadable without it. Sits outside the parallax layer so
                      it stays welded to the frame it is darkening. */}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-brand-black/85 via-brand-black/40 to-transparent"
                  />

                  <div
                    data-expo="content"
                    className="absolute inset-x-0 bottom-0 will-change-transform"
                  >
                    <div className="max-w-2xl p-6 sm:p-8 lg:p-12">
                      <p className="text-xs font-semibold tracking-[0.22em] text-brand-white/70 uppercase sm:text-sm">
                        {t(`slides.${slide.key}.eyebrow`)}
                      </p>

                      <SlideHeadline index={index}>
                        {t(`slides.${slide.key}.headline`)}
                      </SlideHeadline>

                      <ButtonLink
                        href={slide.cta}
                        size="lg"
                        className="mt-6 lg:mt-8"
                        // An off-screen slide is not a tab stop. Without this
                        // the deck buries three more CTAs in the tab order and
                        // reaching the header's next link means passing all of
                        // them.
                        tabIndex={index === active ? undefined : -1}
                      >
                        {t(`slides.${slide.key}.cta`)}
                        <ArrowRight className="size-5 shrink-0" />
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {heroSlides.length > 1 ? (
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  aria-label={t("goTo", { index: index + 1 })}
                  aria-current={index === active}
                  onClick={() => scrollToSlide(index)}
                  className={cn(
                    // A dot, so `rounded-full` is allowed — DESIGN.md §5 rules
                    // out pills for buttons, not for indicators. The active one
                    // stretches rather than only changing colour, which survives
                    // both a small screen and a colour-blind reading.
                    "h-2 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                    index === active
                      ? "w-8 bg-brand-red"
                      : "w-2 bg-brand-black/20 hover:bg-brand-black/40",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <SliderArrow
                side="left"
                label={t("previous")}
                onClick={() => scrollToSlide(active - 1)}
              />
              <SliderArrow
                side="right"
                label={t("next")}
                onClick={() => scrollToSlide(active + 1)}
              />
            </div>
          </div>
        ) : null}
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
function SlideHeadline({ index, children }: { index: number; children: React.ReactNode }) {
  const className =
    "mt-3 font-heading text-3xl font-bold tracking-tight text-balance text-brand-white drop-shadow-sm sm:text-4xl lg:text-5xl";

  return index === 0 ? (
    <h1 className={className}>{children}</h1>
  ) : (
    <p className={className}>{children}</p>
  );
}

function SliderArrow({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full border border-brand-black/15 bg-surface text-brand-black transition-colors hover:border-brand-red/50 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
