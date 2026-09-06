"use client";

import { SliderArrow } from "@/components/ui/slider-arrow";
import type { AutoplayBeat } from "@/lib/use-autoplay";
import { cn } from "@/lib/utils";

/**
 * The control row every slider on the site puts under its deck: the dots on
 * the left, the two arrows on the right, and — for a deck that plays itself —
 * the countdown to the next turn drawn into the active dot.
 *
 * ── One row, three decks ────────────────────────────────────────────────────
 *
 * It was three copies of the same markup: `ui/expo-slider.tsx` (the homepage
 * hero), `sections/home-carousel.tsx` (the homepage strips and `/about`'s
 * certificates) and `products/page/product-gallery-section.tsx` (the showroom
 * band). They agreed on the geometry — an 8px dot, a 44px hit area, a
 * `flex-wrap` row that cannot widen the page — and disagreed on the one thing
 * that mattered: only the product page's said how long the slide had left.
 * The decks are different (a scroll-snap track, a Swiper strip and a stack of
 * absolutely-positioned frames, for reasons documented in each), but the row
 * under them is one component now, and every self-playing deck counts down.
 *
 * ── The countdown ───────────────────────────────────────────────────────────
 *
 * The active dot stretches into a 50px track and a fill crosses it once per
 * beat, which makes the strip a pager *and* a clock: the deck says how long is
 * left instead of turning unannounced.
 *
 * It is a CSS animation rather than a per-frame transform, so it runs on the
 * compositor and costs nothing to keep going; `beat.duration` sets its length
 * and `beat.running` its play state. Both come from `lib/use-autoplay.ts`,
 * which is also what turns the deck — one clock driving the picture and the
 * bar, so a hover that freezes the fill freezes the turn with it and they
 * resume together. See that file for what happens to the remainder.
 *
 * `beat.id` keys the fill: a turn the visitor asked for changes it and the bar
 * starts from empty, even when they picked the slide that was already lit.
 *
 * Held, the fill also dims. Frozen at full black it is indistinguishable from
 * a bar that has finished and a deck that has stopped working; at half
 * strength it reads as what it is — a countdown someone is standing on.
 *
 * A deck with no autoplay (`beat` absent, or a slider whose motion is off
 * under `prefers-reduced-motion`) keeps the plain 32px dot: a bar that never
 * fills would promise a turn that is not coming.
 */

/**
 * The site runs two blacks. Everything outside the product page uses the
 * brandbook's `#1d1d1b`; the product page is a separate palette built on pure
 * black (`products/page/section-kit.tsx`) and must not be dragged off it by a
 * shared control.
 */
type Tone = "brand" | "black";

const tones: Record<Tone, { dot: string; track: string; fill: string; ring: string }> = {
  brand: {
    dot: "bg-brand-black/20 group-hover:bg-brand-black/40 group-active:bg-brand-black/40",
    track: "bg-brand-black/15",
    fill: "bg-brand-black",
    ring: "focus-visible:ring-brand-black",
  },
  black: {
    dot: "bg-black/20 group-hover:bg-black/40 group-active:bg-black/40",
    track: "bg-black/15",
    fill: "bg-black",
    ring: "focus-visible:ring-black",
  },
};

export interface SliderPagerProps {
  /** Real slides, never the clones or repeats a deck keeps for its loop. */
  count: number;
  active: number;
  onSelect: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  labels: {
    previous: string;
    next: string;
    /** «Перейти к слайду {index}», 1-based. Falls back to a bare "3 / 8". */
    goTo?: (index: number) => string;
  };
  /** The countdown to draw, from `useAutoplay`. Absent for a still deck. */
  beat?: AutoplayBeat | null;
  tone?: Tone;
  /**
   * The row's own spacing above the deck. Deliberately required rather than
   * defaulted: `cn` here is a plain join, not a Tailwind-aware merge, so a
   * default `mt-4` could not be overridden by a caller wanting `mt-6` — the
   * two classes would both survive and the winner would be whichever the
   * generated stylesheet happened to put last.
   */
  className: string;
}

export function SliderPager({
  count,
  active,
  onSelect,
  onPrevious,
  onNext,
  labels,
  beat = null,
  tone = "brand",
  className,
}: SliderPagerProps) {
  // One slide is not a slider: no dot to press, no arrow that goes anywhere.
  if (count < 2) return null;

  const palette = tones[tone];

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      {/* `gap-0` on the row and `px-1` on each button, so the dots keep the 8px
          air they had while the buttons themselves touch: the strip becomes one
          continuous band of targets instead of a line of 8px points with dead
          space between them. The row is already 44px tall because of the arrows
          beside it, so `h-11` costs no layout.

          ⚠️ `min-w-0 flex-wrap` is what stops a long pager from widening the
          page: every deck here is admin-managed, so the row is as long as the
          client's list, and `/about`'s fourteen certificates need 248px next to
          a 96px pair of arrows — more than the 328px gutter-to-gutter of a
          360px phone, which is most Android screens here. Without it the row
          could not shrink below its content and `<html>` grew to 368px, so the
          whole page scrolled sideways. */}
      <div className="-mx-1 flex min-w-0 flex-wrap items-center gap-0">
        {Array.from({ length: count }, (_, index) => {
          const current = index === active;

          return (
            <button
              key={index}
              type="button"
              aria-label={labels.goTo?.(index + 1) ?? `${index + 1} / ${count}`}
              aria-current={current}
              onClick={() => onSelect(index)}
              className={cn(
                "group flex h-11 min-w-0 shrink-0 cursor-pointer items-center px-1 focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                palette.ring,
              )}
            >
              <span
                aria-hidden
                className={cn(
                  // `transition-all`, so the dot the visitor picks is seen
                  // growing into the bar rather than the strip re-laying itself
                  // out in one frame.
                  //
                  // A dot, so `rounded-full` is allowed — DESIGN.md §5 rules out
                  // pills for buttons, not for indicators. The active one
                  // stretches rather than only changing colour, which survives
                  // both a small screen and a colour-blind reading.
                  "relative block h-2 overflow-hidden rounded-full transition-all duration-300",
                  current
                    ? beat
                      ? // 50px flat, and `max-w-full` for the narrowest phones,
                        // where the bar and its dots would otherwise be wider
                        // than the gutter allows.
                        cn("w-[50px] max-w-full", palette.track)
                      : cn("w-8", palette.fill)
                    : cn("w-2", palette.dot),
                )}
              >
                {current && beat ? (
                  <span
                    aria-hidden
                    // Keyed on the beat, so the fill restarts from zero even
                    // when the visitor picks the slide that is already lit.
                    key={beat.id}
                    style={{
                      animationDuration: `${beat.duration}ms`,
                      animationPlayState: beat.running ? "running" : "paused",
                    }}
                    className={cn(
                      "absolute inset-y-0 left-0 w-full origin-left rounded-full transition-opacity duration-200 will-change-transform motion-safe:animate-[slider-beat_linear_forwards] motion-reduce:scale-x-100",
                      palette.fill,
                      !beat.running && "opacity-50",
                    )}
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* Every deck here loops, so neither arrow is ever a dead end and
            neither has a disabled state to reach. */}
        <SliderArrow side="left" label={labels.previous} onClick={onPrevious} />
        <SliderArrow side="right" label={labels.next} onClick={onNext} />
      </div>
    </div>
  );
}
