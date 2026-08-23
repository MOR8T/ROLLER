"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";

import { SliderArrow } from "@/components/ui/slider-arrow";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { cn } from "@/lib/utils";

/**
 * The site's photo slider: a scroll-snap track with an Expo-style parallax, a
 * seamless loop, mouse dragging and autoplay.
 *
 * It began as the homepage hero and now runs the product page's showroom band
 * as well, which is why it lives here rather than in either of them. Both call
 * sites pass photographs and labels; everything below — the motion, the loop,
 * the gesture handling — is the same code for both.
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
 * There is no Swiper here. The track is a plain scroll container and `progress`
 * is read off `scrollLeft`, so touch keeps the browser's own momentum,
 * rubber-band and snapping for zero bytes, and the arrows, dots and autoplay
 * all just `scrollTo` the one element. The per-frame styles are written
 * imperatively rather than through state: at 60fps a `setState` per layer per
 * slide would re-render the whole deck for values React never needs to know
 * about.
 *
 * ── The loop ────────────────────────────────────────────────────────────────
 *
 * A scroll container cannot wrap on its own, so the deck is rendered as
 *
 *     [ clone of last | 0 | 1 | … | n | clone of first ]
 *
 * and parked one slide in, on the first real photograph. Reaching either clone
 * shows the same picture as the real slide at the far end, so once the deck
 * settles there `scrollLeft` is reassigned to that twin with no animation:
 * identical pixels, no repaint anyone can see, and the track is suddenly a long
 * way from its own edge again. The strip only ever moves forwards.
 *
 * ⚠️ The clones are added *after* mount, not during the server render. Rendered
 * on the server they would put the last slide first, and the deck would open on
 * the wrong picture for as long as hydration takes. `useIsomorphicLayoutEffect`
 * flips them on and re-parks the track in the same commit, before first paint.
 */

/** Frame zoom for a neighbour, matching the reference's `scale(1.25)`. */
const FRAME_ZOOM = 0.25;

/**
 * Image counter-zoom. Deliberately *not* the frame's: the picture has to lag
 * behind its own frame, and matching the two would cancel the parallax out.
 */
const IMAGE_ZOOM = 0.125;

/**
 * How long after the last scroll event the deck is considered settled, and the
 * seam is repaired.
 *
 * Short enough that it always lands between two autoplay beats, long enough
 * that a smooth `scrollTo` — which emits events continuously while it runs —
 * never looks idle mid-flight and gets teleported out from under itself.
 */
const SETTLE_MS = 140;

/**
 * How far the mouse has to travel before a press becomes a drag. Below this a
 * press is still a click, so a CTA underneath keeps working — a slider that
 * eats the button it is advertising is worse than one that does not drag.
 */
const DRAG_THRESHOLD = 8;

/**
 * Fraction of the track a drag must cover to turn the page. Well under half:
 * the gesture people actually make is a short flick, and demanding 50% means a
 * flick springs back and reads as a dead slider.
 */
const DRAG_COMMIT = 0.15;

export interface ExpoSlide {
  key: string;
  image: string;
  alt: string;
  /** Only the opening slide may be LCP-eligible. */
  priority?: boolean;
  /**
   * Anything drawn over the photograph — a headline, a button. Receives the
   * slide's own state so a caller can keep off-screen links out of the tab
   * order, or promote only the first real slide's line to an `<h1>`.
   */
  content?: (state: { active: boolean; clone: boolean; index: number }) => ReactNode;
}

export interface ExpoSliderProps {
  slides: ExpoSlide[];
  labels: {
    /** «Слайд {index} из {total}» for the slide's own `aria-label`. */
    slide?: (index: number, total: number) => string;
    /** «Перейти к слайду {index}» for a dot. */
    goTo?: (index: number) => string;
    previous: string;
    next: string;
  };
  /** Aspect ratio of the frame, as Tailwind classes. */
  frameClassName?: string;
  imageSizes?: string;
  /** Dark gradient under the content layer. Off where nothing is written over the picture. */
  scrim?: boolean;
  /** Milliseconds between beats, or `null` to leave the deck still. */
  autoplayMs?: number | null;
  /**
   * `below` — dots and arrows in a row under the deck (the homepage).
   * `overlay` — arrows only, floating in the bottom right corner.
   */
  controls?: "below" | "overlay";
  /** Wrapper around the track: the rounding and the ground behind the pictures. */
  className?: string;
}

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

export function ExpoSlider({
  slides,
  labels,
  frameClassName = "aspect-square sm:aspect-[4/3] lg:aspect-[16/9]",
  imageSizes = "100vw",
  scrim = false,
  autoplayMs = null,
  controls = "below",
  className,
}: ExpoSliderProps) {
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
   * scroll handler wired to the old one would keep reading zero.
   */
  const offsetRef = useRef(0);

  const deck = looped
    ? [
        { slide: slides[slides.length - 1], real: slides.length - 1, clone: true },
        ...slides.map((slide, real) => ({ slide, real, clone: false })),
        { slide: slides[0], real: 0, clone: true },
      ]
    : slides.map((slide, real) => ({ slide, real, clone: false }));

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
      if (!box || !picture) continue;

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

      if (content) {
        content.style.transform = still ? "" : `translateX(${-progress * 100}%)`;
        // Gone by the halfway mark: copy legible over two photographs at once is
        // copy legible over neither.
        content.style.opacity = `${1 - 2 * away}`;
      }
    }

    // The dots track the *real* slide, so the two clones have to be folded back
    // onto the pictures they copy — otherwise the deck lights no dot at all for
    // the moment it spends on a clone.
    const total = slides.length;
    const position = Math.round(element.scrollLeft / width) - offsetRef.current;
    const next = ((position % total) + total) % total;
    setActive((current) => (current === next ? current : next));
  }, [slides.length]);

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

    const total = slides.length;
    const position = Math.round(element.scrollLeft / width);

    if (position === 0) element.scrollLeft = total * width;
    else if (position === total + 1) element.scrollLeft = width;
  }, [slides.length]);

  // One paint per frame at most. A scroll can fire several events per frame and
  // every one of them would otherwise walk every slide.
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

  // Clones go in after mount — see the note at the top of the file.
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
   * Nothing wraps here. Asking for one past the end lands on the trailing clone
   * — which shows the first picture — and `repairSeam` puts the deck back at the
   * real one a moment later. Going forwards forever is a sequence of single
   * steps forwards, which is exactly what it should look like. The clamp only
   * stops a fast drag from asking for track that does not exist.
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

  const step = useCallback(
    (direction: 1 | -1) => {
      const element = track.current;
      if (element) goTo(positionOf(element) + direction);
    },
    [goTo, positionOf],
  );

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
      // wanders off the deck.
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
    if (!autoplayMs || paused || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      const element = track.current;
      if (!element) return;

      // Read the position off the element rather than off `active`: the effect
      // must not re-subscribe on every advance, or the interval restarts each
      // time and one slide silently gets a double beat.
      //
      // One step forwards, always. With a clone in front of the last slide
      // there is somewhere to go, and `repairSeam` has already moved the deck
      // off it long before the next beat — `SETTLE_MS` against `autoplayMs`.
      goTo(positionOf(element) + 1);
    }, autoplayMs);

    return () => window.clearInterval(timer);
  }, [autoplayMs, paused, goTo, positionOf, slides.length]);

  const overlay = controls === "overlay";

  return (
    <div className={cn(overlay && "relative")}>
      <div
        className={className}
        // Pause on hover *and* on focus: a keyboard visitor tabbing to a CTA has
        // no pointer to hover with, and having the slide scroll out from under
        // the focused button is the worst version of this.
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
          // The click that closes a drag has to die here, or letting go over a
          // CTA navigates away from a page the visitor was only browsing.
          // Capture phase, so it never reaches the link at all.
          onClickCapture={(event) => {
            if (!dragged.current) return;
            dragged.current = false;
            event.preventDefault();
            event.stopPropagation();
          }}
          // Otherwise the browser's own image drag starts instead of ours and
          // the cursor walks off with a ghost of the picture.
          onDragStart={(event) => event.preventDefault()}
          // `overflow-y-hidden` is load-bearing, not tidiness: a neighbour at
          // scale 1.25 overflows the frame vertically, and leaving that axis
          // `visible` would both spill it over the header and hand the track a
          // vertical scrollbar it has no use for.
          //
          // `select-none` is part of dragging: without it the gesture paints the
          // headline blue instead of moving the deck.
          className="flex cursor-grab snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overflow-y-hidden select-none active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
        >
          {deck.map(({ slide, real, clone }, index) => (
            <div
              key={clone ? `clone-${index}` : slide.key}
              // A clone is scenery. It is the same picture announced a second
              // time, so it is hidden from assistive technology entirely —
              // otherwise the deck reports two slides more than it has.
              {...(clone
                ? { "aria-hidden": true as const }
                : {
                    role: "group",
                    "aria-roledescription": "slide",
                    "aria-label": labels.slide?.(real + 1, slides.length),
                  })}
              className="w-full shrink-0 snap-center"
            >
              <div
                data-expo="frame"
                className={cn(
                  "relative w-full overflow-hidden will-change-transform",
                  frameClassName,
                )}
              >
                <div
                  data-expo="image"
                  // 125% wide and pulled half the excess to the left, so the
                  // counter-translation has somewhere to travel and never walks
                  // an edge into frame.
                  className="absolute inset-y-0 -left-[12.5%] w-[125%] will-change-transform"
                >
                  <Image
                    src={slide.image}
                    alt={clone ? "" : slide.alt}
                    fill
                    className="object-cover"
                    priority={slide.priority && !clone}
                    loading={slide.priority && !clone ? undefined : "lazy"}
                    sizes={imageSizes}
                  />
                </div>

                {scrim ? (
                  // Scrim, not decoration: white copy over a sunset facade is
                  // unreadable without it. Sits outside the parallax layer so it
                  // stays welded to the frame it is darkening.
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-brand-black/85 via-brand-black/40 to-transparent"
                  />
                ) : null}

                {slide.content ? (
                  <div
                    data-expo="content"
                    className="absolute inset-x-0 bottom-0 will-change-transform"
                  >
                    {slide.content({ active: real === active && !clone, clone, index: real })}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        overlay ? (
          <div className="absolute right-5 bottom-6 z-10 flex gap-3 lg:right-10 lg:bottom-10">
            <SliderArrow side="left" label={labels.previous} overlay onClick={() => step(-1)} />
            <SliderArrow side="right" label={labels.next} overlay onClick={() => step(1)} />
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  aria-label={labels.goTo?.(index + 1)}
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
              {/* Stepping the *track*, not the slide list. From the last picture
                  "next" walks onto the trailing clone and the seam repair takes
                  it home — so the arrows wrap without ever scrolling backwards,
                  same as autoplay. */}
              <SliderArrow side="left" label={labels.previous} onClick={() => step(-1)} />
              <SliderArrow side="right" label={labels.next} onClick={() => step(1)} />
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
