"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

import { SliderPager } from "@/components/ui/slider-pager";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { useAutoplay } from "@/lib/use-autoplay";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { cn } from "@/lib/utils";
import { ImzoSection, ImzoSectionHeader, imzoRadius } from "./section-kit";
import type { ProductGallerySectionData } from "@/types/product-page";

/** Long enough to look at a photograph — the beat the homepage deck uses. */
const AUTOPLAY_MS = 6000;

/** One transition. Matches the frame's `duration-700`. */
const TRANSITION_MS = 700;

/** How far a drag must travel before it turns the page. */
const SWIPE_PX = 48;

/**
 * The showroom band.
 *
 * ── Why this is not `ExpoSlider` ────────────────────────────────────────────
 *
 * It used to be: the homepage hero's deck, run edge to edge with two arrows
 * floating in the corner. Two things were wrong with that. It was the only
 * section on this page that left `Container`, so its pictures started at the
 * viewport edge while every heading above and below started at the gutter; and
 * the hero's motion greys out the neighbouring frame, which on a strip of
 * interior photography reads as a dimmed, half-dead slider.
 *
 * So this one is a stack, not a track. Every slide sits absolutely in the same
 * frame and only two of them move at a time — the one arriving and the one
 * leaving — which is what makes more than one transition possible at all. A
 * scroll-snap track can only ever slide.
 *
 * ⚠️ `ExpoSlider` is still the homepage hero's and must stay as it is; this
 * page no longer imports it.
 *
 * ── The transitions ─────────────────────────────────────────────────────────
 *
 * Four of them, used in turn rather than chosen once (`EFFECTS`): the client
 * asked for the band to feel alive, and a gallery that always does the same
 * thing stops being watched after the second photograph. They are ordered so no
 * two neighbours look alike — a wipe, then a zoom, then a push, then a
 * dissolve.
 *
 * Each effect is a *pair* of styles, "where the incoming slide starts" and
 * "where the outgoing slide ends"; the resting state is the same for all four,
 * so a transition is one CSS transition between two inline styles and never an
 * animation that has to be restarted or cleaned up.
 *
 * ── Why `ready` ─────────────────────────────────────────────────────────────
 *
 * A slide cannot be given its starting style and its resting style in the same
 * commit — the browser sees one value and there is nothing to interpolate. So a
 * turn renders once with transitions off and the incoming slide parked at
 * `enter`, and the next frame flips `ready` and lets it travel. Two nested
 * `requestAnimationFrame`s, because the first only guarantees the style is
 * computed, not painted.
 *
 * Every picture stays mounted the whole time: they are all inside the frame, so
 * the browser has already fetched them, and unmounting the ones off-screen
 * would make each turn wait on a decode.
 *
 * ── The pager and the clock ─────────────────────────────────────────────────
 *
 * This deck is where the filling pager bar started, and both halves of it now
 * belong to the whole site: `components/ui/slider-pager.tsx` draws the row and
 * `lib/use-autoplay.ts` runs the beat, so the homepage decks count down the
 * same way. The transitions above are still this file's alone.
 */

type Effect = {
  /** Where the arriving slide comes from. */
  enter: (direction: 1 | -1) => CSSProperties;
  /** Where the leaving slide goes. */
  exit: (direction: 1 | -1) => CSSProperties;
};

const EFFECTS: Effect[] = [
  // Wipe: the new photograph is uncovered in place, the old one drifts a little
  // under it. The only effect where nothing about the arriving picture moves.
  {
    enter: (d) => ({ clipPath: d > 0 ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)" }),
    exit: (d) => ({ transform: `translateX(${-6 * d}%) scale(1.04)` }),
  },
  // Zoom: forward pushes in, back pulls out, so the direction is legible even
  // though nothing travels sideways.
  {
    enter: (d) => ({ opacity: 0, transform: `scale(${d > 0 ? 1.14 : 0.9})` }),
    exit: (d) => ({ opacity: 0, transform: `scale(${d > 0 ? 0.92 : 1.12})` }),
  },
  // Push: the plain one, with the outgoing frame moving half as far so the two
  // read as separate planes rather than one strip.
  {
    enter: (d) => ({ opacity: 0.4, transform: `translateX(${100 * d}%)` }),
    exit: (d) => ({ opacity: 0.4, transform: `translateX(${-50 * d}%)` }),
  },
  // Dissolve, with a breath of scale so it is not a dead cross-fade.
  {
    enter: () => ({ opacity: 0, transform: "scale(1.06)" }),
    exit: () => ({ opacity: 0, transform: "scale(0.99)" }),
  },
];

/** Resting pose — where every effect above lands. */
const REST: CSSProperties = {
  opacity: 1,
  transform: "none",
  clipPath: "inset(0 0 0 0)",
};

type Turn = {
  active: number;
  /** The slide being left, or `-1` on the very first render. */
  from: number;
  direction: 1 | -1;
  /** Which of `EFFECTS` this turn uses. */
  effect: number;
};

export function ProductGallerySection({
  data,
  locale,
}: {
  data: ProductGallerySectionData;
  locale: Locale;
}) {
  const slides = (data.media ?? []).map((media) => ({
    key: media.src,
    src: media.src,
    alt: localized(media.alt, locale),
  }));

  const total = slides.length;

  const [turn, setTurn] = useState<Turn>({
    active: 0,
    from: -1,
    direction: 1,
    effect: 0,
  });
  const [ready, setReady] = useState(true);

  // Scroll-linked or not, this is movement: under `prefers-reduced-motion` the
  // deck keeps paging and keeps autoplaying, it simply cuts instead of moving.
  const still = useReducedMotion();

  const goTo = useCallback((next: number, direction: 1 | -1) => {
    setTurn((current) => {
      if (next === current.active) return current;

      return {
        active: next,
        from: current.active,
        direction,
        // Next effect in the ring, so consecutive turns never repeat.
        effect: (current.effect + 1) % EFFECTS.length,
      };
    });
    setReady(false);
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (total < 2) return;
      setTurn((current) => {
        const next = (current.active + direction + total) % total;

        return {
          active: next,
          from: current.active,
          direction,
          effect: (current.effect + 1) % EFFECTS.length,
        };
      });
      setReady(false);
    },
    [total],
  );

  // Let the parked style paint before it is allowed to travel — see the note at
  // the top of the file.
  useEffect(() => {
    if (ready) return;

    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });

    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [ready]);

  /**
   * Autoplay, and the bar under the deck that counts it down — one clock for
   * both (`lib/use-autoplay.ts`).
   *
   * The hook holds the beat while the tab is in the background, which this deck
   * needs for more than politeness: a timer keeps firing in a hidden tab but
   * `requestAnimationFrame` does not, so a turn taken there would park the
   * arriving slide at its `enter` pose and stay in it — `ready` is flipped from
   * a frame that never comes — and a visitor coming back would find the gallery
   * frozen mid-wipe.
   */
  const { beat, setPaused, restart } = useAutoplay({
    delay: AUTOPLAY_MS,
    enabled: total > 1,
    onAdvance: () => step(1),
  });

  /**
   * A turn the visitor asked for, as opposed to one the clock took.
   *
   * ⚠️ The restart is the whole point: without it, pressing the arrow five
   * seconds into a six-second beat hands the new slide the last second of the
   * old countdown. The bar starts filling and is cut off almost immediately,
   * which reads as an animation that does not work rather than as a timer that
   * was already nearly up.
   */
  const move = useCallback(
    (direction: 1 | -1) => {
      step(direction);
      restart();
    },
    [step, restart],
  );

  /**
   * Swipe.
   *
   * The frame is not a scroll container any more, so the browser has no gesture
   * of its own here and touch has to be handled with the same three events as
   * the mouse. Nothing inside the frame is clickable, so there is no click to
   * suppress on release.
   */
  const swipe = useRef<{ pointer: number; x: number } | null>(null);

  function endSwipe(event: React.PointerEvent) {
    const start = swipe.current;
    if (!start || event.pointerId !== start.pointer) return;

    swipe.current = null;

    const travelled = event.clientX - start.x;
    if (Math.abs(travelled) < SWIPE_PX) return;

    move(travelled < 0 ? 1 : -1);

    // The cursor is still on the photograph, and being on the photograph is what
    // pauses the deck — so without this the beat the swipe just started would sit
    // at zero until the pointer wandered off. A drag is a request to move on, not
    // the still gaze the hover pause exists for: the countdown resumes with it and
    // runs from the top. The pause comes back the next time the pointer enters.
    setPaused(false);
  }

  if (total === 0) return null;

  const effect = EFFECTS[turn.effect];

  return (
    <ImzoSection id={data.id}>
      {/* The section may have no heading at all — the client's galleries are
          usually just the photographs — and an empty header would still leave
          its bottom margin above the frame. */}
      {localized(data.title, locale) || localized(data.description, locale) ? (
        <ImzoSectionHeader section={data} locale={locale} className="mb-8" />
      ) : null}

      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={localized(data.title, locale) || undefined}
        tabIndex={0}
        // Pause on hover *and* on focus: a keyboard visitor has no pointer to
        // hover with, and a deck that turns under the arrow they are about to
        // press is the worst version of this.
        // Focus pauses the deck only while the *region itself* holds it — the
        // keyboard visitor who has tabbed to the gallery and is reading it.
        // Focus landing on an arrow or a dot must not pause: a mouse click
        // focuses the button it presses, and pausing there would freeze the
        // countdown of the very slide the visitor just asked for.
        onFocus={(event) => {
          if (event.target === event.currentTarget) setPaused(true);
        }}
        onBlur={(event) => {
          if (event.target === event.currentTarget) setPaused(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          else if (event.key === "ArrowRight") move(1);
          else return;
          event.preventDefault();
        }}
        className="focus-visible:outline-none"
      >
        <div
          // The photograph is what pauses the deck, not the whole block. Held on
          // the region, the pause covered the controls too — so the pointer that
          // pressed an arrow was also the pointer stopping the clock, and the bar
          // it had just restarted sat frozen at zero.
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onPointerDown={(event) => {
            swipe.current = { pointer: event.pointerId, x: event.clientX };
          }}
          onPointerUp={endSwipe}
          onPointerCancel={() => {
            swipe.current = null;
          }}
          onDragStart={(event) => event.preventDefault()}
          className={cn(
            // The frame is the ground: a light grey card of the page's own
            // radius, so a photograph that has not decoded yet is a pale panel
            // and never a black hole in the middle of a white page.
            "relative w-full touch-pan-y overflow-hidden bg-[rgba(144,144,144,0.1)] select-none",
            imzoRadius,
            // The homepage hero's own ladder (`components/sections/hero-section.tsx`):
            // both decks sit in `Container`, so the same ratios give the same
            // height, and the client asked for this band to stand as tall as the
            // first thing on the site.
            "aspect-[4/3] lg:aspect-[16/9]",
          )}
        >
          {slides.map((slide, index) => {
            const isActive = index === turn.active;
            const isLeaving = index === turn.from && !isActive;

            const pose: CSSProperties = still
              ? { opacity: isActive ? 1 : 0, transform: "none", clipPath: "inset(0 0 0 0)" }
              : isActive
                ? ready
                  ? REST
                  : effect.enter(turn.direction)
                : isLeaving
                  ? ready
                    ? effect.exit(turn.direction)
                    : REST
                  : { opacity: 0 };

            return (
              <div
                key={slide.key}
                aria-hidden={!isActive}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} / ${total}`}
                style={{
                  ...pose,
                  // Transitions are off for the frame that parks the incoming
                  // slide at its starting pose, and off entirely for the slides
                  // taking no part in this turn — otherwise a third picture
                  // fades every time two others swap.
                  transitionProperty:
                    ready && !still && (isActive || isLeaving)
                      ? "opacity, transform, clip-path"
                      : "none",
                  transitionDuration: `${TRANSITION_MS}ms`,
                  transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className={cn(
                  "absolute inset-0 will-change-[opacity,transform]",
                  // Arriving above leaving, and the rest of the deck below
                  // both — the wipe only reads if it uncovers something.
                  isActive ? "z-20" : isLeaving ? "z-10" : "z-0",
                )}
              >
                <Image
                  src={slide.src}
                  alt={isActive ? slide.alt : ""}
                  fill
                  sizes="(min-width: 80rem) 76rem, 100vw"
                  className="object-cover"
                />
              </div>
            );
          })}
        </div>

        {/* Dots, a bar and the two arrows — the site's own control row
            (`components/ui/slider-pager.tsx`), in this page's pure black rather
            than the brandbook's off-black. The active dot stretches into a
            track and fills over the beat, so the deck says how long is left
            instead of turning unannounced. */}
        <SliderPager
          count={total}
          active={turn.active}
          onSelect={(index) => {
            goTo(index, index > turn.active ? 1 : -1);
            restart();
          }}
          onPrevious={() => move(-1)}
          onNext={() => move(1)}
          labels={{
            previous: localized(data.controls.previous, locale),
            next: localized(data.controls.next, locale),
          }}
          beat={beat}
          tone="black"
          className="mt-5"
        />
      </div>
    </ImzoSection>
  );
}
