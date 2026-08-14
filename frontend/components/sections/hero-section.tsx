"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { heroSlides } from "@/data/home";
import { PillLink } from "@/components/sections/home-kit";
import { Container } from "@/components/ui/container";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
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

/**
 * How long after the last scroll event the deck is considered settled, and the
 * seam is repaired.
 *
 * Short enough that it always lands between two autoplay beats, long enough
 * that a smooth `scrollTo` — which emits events continuously while it runs —
 * never looks idle mid-flight and gets teleported out from under itself.
 */
const SETTLE_MS = 140;

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

/**
 * ── The loop ────────────────────────────────────────────────────────────────
 *
 * A scroll container cannot wrap on its own, so the deck is rendered as
 *
 *     [ clone of last | 0 | 1 | 2 | 3 | clone of first ]
 *
 * and parked one slide in, on the first real banner. Reaching either clone
 * shows the same picture as the real slide at the far end, so once the deck
 * settles there `scrollLeft` is reassigned to that twin with no animation:
 * identical pixels, no repaint anyone can see, and the track is suddenly a long
 * way from its own edge again. That is the whole trick — the strip only ever
 * moves forwards, and the rewind the old `% length` wrap performed (four slides
 * of visible backwards travel every cycle) is gone.
 *
 * ⚠️ The clones are added *after* mount, not during the server render. Rendered
 * on the server they would put the last banner first, and the deck would open
 * on slide 4 for as long as hydration takes. `useIsomorphicLayoutEffect` flips
 * them on and re-parks the track in the same commit, before the first paint.
 */
export function HeroSection() {
  const t = useTranslations("hero");

  const track = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const settle = useRef(0);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [looped, setLooped] = useState(false);

  /**
   * How far the real slides are shifted along the track: one once the leading
   * clone exists, zero before that.
   *
   * A ref rather than the state itself because `paint` and `repairSeam` run on
   * every scroll event and must not be rebuilt when it changes — a `useCallback`
   * that closed over the state would be a new function on the flip, and the
   * scroll handler wired to the old one would keep reading zero. It is written
   * in the layout effect below, never during render.
   */
  const offsetRef = useRef(0);

  const deck = looped
    ? [
        { slide: heroSlides[heroSlides.length - 1], real: heroSlides.length - 1, clone: true },
        ...heroSlides.map((slide, real) => ({ slide, real, clone: false })),
        { slide: heroSlides[0], real: 0, clone: true },
      ]
    : heroSlides.map((slide, real) => ({ slide, real, clone: false }));

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

    // The dots track the *real* slide, so the two clones have to be folded back
    // onto the banners they copy — otherwise the deck lights no dot at all for
    // the moment it spends on a clone.
    const total = heroSlides.length;
    const position = Math.round(element.scrollLeft / width) - offsetRef.current;
    const next = ((position % total) + total) % total;
    setActive((current) => (current === next ? current : next));
  }, []);

  /**
   * Move off a clone and onto the real slide it copies.
   *
   * Assigned rather than animated, and deliberately without touching
   * `scroll-snap-type`: the destination *is* a snap position, so there is
   * nothing for the browser to re-snap and nothing to turn off. The two
   * positions render the same photograph, so the only thing that changes is how
   * much track is left in front of the deck.
   */
  const repairSeam = useCallback(() => {
    const element = track.current;
    if (!element || !offsetRef.current) return;

    const width = element.clientWidth;
    if (!width) return;

    const total = heroSlides.length;
    const position = Math.round(element.scrollLeft / width);

    if (position === 0) element.scrollLeft = total * width;
    else if (position === total + 1) element.scrollLeft = width;
  }, []);

  // One paint per frame at most. A scroll can fire several events per frame and
  // every one of them would otherwise walk all four slides.
  //
  // The same handler arms the settle timer, so "the deck stopped moving" is one
  // signal with one source rather than a `scrollend` listener that Safari only
  // learned recently.
  const schedulePaint = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);

    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(repairSeam, SETTLE_MS);
  }, [paint, repairSeam]);

  // Clones go in after mount — see the note on the component. This runs before
  // the browser paints, so the deck is never seen at the leading clone.
  useIsomorphicLayoutEffect(() => setLooped(true), []);

  useIsomorphicLayoutEffect(() => {
    const element = track.current;
    if (!element || !looped) return;

    // Order matters by one line: the assignment below fires a scroll event, and
    // the handler it reaches reads this ref to fold clones back onto the slides
    // they copy. Set second, the very first paint would place the deck a slide
    // out.
    offsetRef.current = 1;
    element.scrollLeft = element.clientWidth;
  }, [looped]);

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
      window.clearTimeout(settle.current);
    };
  }, [paint, schedulePaint]);

  /**
   * Scroll to a position on the *track*, clones included.
   *
   * Nothing wraps here any more. Asking for one past the end lands on the
   * trailing clone — which shows the first banner — and `repairSeam` puts the
   * deck back at the real one a moment later. Going forwards forever is a
   * sequence of single steps forwards, which is exactly what it should look
   * like. The clamp only stops a fast drag from asking for track that does not
   * exist.
   */
  const goTo = useCallback((position: number, behavior: ScrollBehavior = "smooth") => {
    const element = track.current;
    if (!element) return;

    const last = element.children.length - 1;
    const target = Math.max(0, Math.min(last, position));

    element.scrollTo({ left: target * element.clientWidth, behavior });
  }, []);

  /** Where the deck is on the track right now, clones included. */
  const positionOf = useCallback((element: HTMLElement) => {
    const width = element.clientWidth;
    return width ? Math.round(element.scrollLeft / width) : 0;
  }, []);

  /** A dot names a real slide; the track counts clones too. */
  const goToSlide = useCallback((real: number) => goTo(real + offsetRef.current), [goTo]);

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

    goTo(from + (committed ? -Math.sign(travelled) : 0));
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
      //
      // One step forwards, always. The old `% heroSlides.length` here is what
      // made the fourth beat scroll all the way back across three banners; with
      // the clone in front of the last slide there is somewhere to go instead,
      // and `repairSeam` has already moved the deck off the trailing clone long
      // before the next beat — `SETTLE_MS` against `AUTOPLAY_MS`.
      goTo(positionOf(element) + 1);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [paused, goTo, positionOf]);

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
        <div
          // `rounded-[1.75rem]`, not `rounded-card`: the homepage runs on its
          // own shape language (`components/sections/home-kit.tsx`) at the
          // client's request, and the deck is the first thing on it.
          className="overflow-hidden rounded-[1.75rem] bg-brand-black"
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
            {deck.map(({ slide, real, clone }, index) => (
              <div
                key={clone ? `clone-${index}` : slide.key}
                // A clone is scenery. It is the same banner announced a second
                // time, so it is hidden from assistive technology entirely and
                // its link is taken out of the tab order below — otherwise the
                // deck reports six slides where there are four, and tabbing
                // through it visits the first banner's button twice.
                {...(clone
                  ? { "aria-hidden": true as const }
                  : {
                      role: "group",
                      "aria-roledescription": "slide",
                      "aria-label": t("slideOf", { index: real + 1, total: heroSlides.length }),
                    })}
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
                      // connection. `real`, not `index`: with the clones in
                      // place the first child is a copy of the *last* banner,
                      // and priority on that would preload the wrong one.
                      priority={real === 0 && !clone}
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
                    {/* Headline and action, and nothing else. The eyebrow
                        ("ЖИЛЫЕ КОМПЛЕКСЫ") is deliberately not rendered: the
                        homepage was cut back to a heading and a link per block,
                        and a slide that says its audience out loud is the one
                        line the picture already makes. `hero.slides.*.eyebrow`
                        is kept in the catalogue — this is a composition
                        decision, and the copy should still be there if the
                        client wants the deck labelled again. */}
                    <div className="max-w-2xl p-6 sm:p-8 lg:p-12">
                      {/* `heading`, not an index test: the trailing clone is
                          also the first banner, and letting it decide for
                          itself would put a second `<h1>` on the page. */}
                      <SlideHeadline heading={real === 0 && !clone}>
                        {t(`slides.${slide.key}.headline`)}
                      </SlideHeadline>

                      {/* White pill on the photograph — the homepage's own
                          action shape. `ButtonLink` still serves every other
                          page. */}
                      <PillLink
                        href={slide.cta}
                        tone="white"
                        className="mt-7 lg:mt-8"
                        // An off-screen slide is not a tab stop. Without this
                        // the deck buries three more CTAs in the tab order and
                        // reaching the header's next link means passing all of
                        // them. A clone is never a tab stop at all.
                        tabIndex={real === active && !clone ? undefined : -1}
                      >
                        {t(`slides.${slide.key}.cta`)}
                        <ArrowRight className="size-4 shrink-0" />
                      </PillLink>
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
                  onClick={() => goToSlide(index)}
                  className={cn(
                    // A dot, so `rounded-full` is allowed — DESIGN.md §5 rules
                    // out pills for buttons, not for indicators. The active one
                    // stretches rather than only changing colour, which survives
                    // both a small screen and a colour-blind reading.
                    "h-2 rounded-full transition-all duration-300 focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none",
                    index === active
                      ? "w-8 bg-brand-black"
                      : "w-2 bg-brand-black/20 hover:bg-brand-black/40",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Stepping the *track*, not the slide list. From the last
                  banner "next" walks onto the trailing clone and the seam
                  repair takes it home — so the arrows wrap without ever
                  scrolling backwards, same as autoplay. */}
              <SliderArrow
                side="left"
                label={t("previous")}
                onClick={() => {
                  const element = track.current;
                  if (element) goTo(positionOf(element) - 1);
                }}
              />
              <SliderArrow
                side="right"
                label={t("next")}
                onClick={() => {
                  const element = track.current;
                  if (element) goTo(positionOf(element) + 1);
                }}
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
function SlideHeadline({ heading, children }: { heading: boolean; children: React.ReactNode }) {
  const className =
    "mt-3 font-heading text-3xl font-bold tracking-tight text-balance text-brand-white drop-shadow-sm sm:text-4xl lg:text-5xl";

  return heading ? (
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
      className="inline-flex size-11 items-center justify-center rounded-full border border-brand-black/15 bg-brand-white text-brand-black transition-colors hover:border-brand-black/45 focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
