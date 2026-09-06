import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The clock behind every self-playing slider on the site.
 *
 * ── Why a hook and not three intervals ──────────────────────────────────────
 *
 * Three decks play themselves — the homepage hero (`ui/expo-slider.tsx`), the
 * homepage strips (`sections/home-carousel.tsx`) and the product page's
 * showroom band (`products/page/product-gallery-section.tsx`) — and each one
 * shows the beat it is on as a filling bar in its pager
 * (`ui/slider-pager.tsx`). A bar is a promise: it says "the next picture
 * arrives when this reaches the end". Anything that makes the fill and the
 * turn disagree reads as a slider that is broken rather than as a timer that
 * is off by a second.
 *
 * ── What a plain `setInterval` got wrong ────────────────────────────────────
 *
 * The bar is a CSS animation, so the browser freezes it in place the moment
 * `animation-play-state` goes to `paused`. An interval has no such memory: a
 * `clearInterval` on hover and a fresh one on leave threw the elapsed time
 * away, so a visitor who rested the cursor on the deck four seconds into a
 * six-second beat resumed with a bar two seconds from full and a turn six
 * seconds away. The bar then sat full for four seconds — the exact impression
 * the countdown exists to avoid.
 *
 * So this bookkeeps the remainder. A hold banks what is left of the beat, a
 * release starts a `setTimeout` for exactly that much, and the fill resumes
 * from the same fraction because it was never restarted — one hold, one
 * remainder, both sides agreeing.
 *
 * ── What holds it ───────────────────────────────────────────────────────────
 *
 * `setPaused` is the caller's: the pointer resting on the deck, focus inside
 * it. The hidden tab is this hook's own — a background tab still fires
 * timeouts (throttled to a second or so) while its animations and
 * `requestAnimationFrame` are stopped, so a deck left running there both turns
 * unwatched and comes back mid-transition, with a bar that never moved.
 *
 * ── `restart` ───────────────────────────────────────────────────────────────
 *
 * Every turn the visitor asks for — an arrow, a dot, a swipe — has to put the
 * countdown back to the top, and `beat.id` is what re-keys the fill so it
 * refills from zero. Without it, pressing "next" one second before a beat
 * expires hands the new slide the last second of the old countdown: the bar
 * flashes and the deck turns again immediately.
 */
export interface AutoplayBeat {
  /** How long one beat lasts, in milliseconds. */
  duration: number;
  /** Whether the countdown is advancing right now, rather than held. */
  running: boolean;
  /** Changes on every restart, and only then. Re-keys the pager's fill. */
  id: number;
}

export interface AutoplayOptions {
  /** Milliseconds between turns, or `null` to leave the deck still. */
  delay: number | null;
  /** False for a deck with nothing to turn to — one slide, or an empty list. */
  enabled?: boolean;
  /** Takes the deck one step forward. Read from a ref, so it may change freely. */
  onAdvance: () => void;
}

export interface Autoplay {
  /** What the pager needs to draw the countdown, or `null` when there is none. */
  beat: AutoplayBeat | null;
  /** True while something is holding the beat. */
  paused: boolean;
  /** Hold and release: the pointer over the deck, focus inside it. */
  setPaused: (paused: boolean) => void;
  /** Put the countdown back to the top, after a turn the visitor asked for. */
  restart: () => void;
}

export function useAutoplay({ delay, enabled = true, onAdvance }: AutoplayOptions): Autoplay {
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [id, setId] = useState(0);

  // The advance is read through a ref so a caller may pass a fresh closure on
  // every render — which all three of them do — without re-arming the clock.
  // As a dependency it would restart the beat on every parent render and the
  // deck would never turn at all.
  const advance = useRef(onAdvance);
  useEffect(() => {
    advance.current = onAdvance;
  });

  const active = enabled && delay !== null && delay > 0;
  const running = active && !paused && !hidden;

  /** What is left of the current beat, or `null` for one that starts from the top. */
  const left = useRef<number | null>(null);

  /**
   * Set by `restart` so the run below throws the remainder away.
   *
   * A flag rather than an assignment inside `restart` itself, because the
   * cleanup that banks the remainder runs *after* `restart` returns — React
   * tears the old effect down as it commits the render `setId` scheduled — and
   * would write the leftover straight back over it.
   */
  const fresh = useRef(false);

  useEffect(() => {
    const sync = () => setHidden(document.hidden);

    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  useEffect(() => {
    // First thing in the body, and therefore after the previous run's cleanup:
    // this is the line that lets `restart` win over the banked remainder.
    if (fresh.current) {
      fresh.current = false;
      left.current = null;
    }

    if (!running || !delay) return;

    const wait = left.current ?? delay;
    const startedAt = Date.now();
    let spent = false;

    const timer = window.setTimeout(() => {
      // Cleared before the advance, so a caller that restarts the beat from
      // inside its own turn handler still gets a full one.
      spent = true;
      left.current = null;
      setId((current) => current + 1);
      advance.current();
    }, wait);

    return () => {
      window.clearTimeout(timer);
      // `Date.now`, not a frame count: the pager's fill is frozen by the
      // browser at whatever fraction it had reached, and only wall-clock time
      // resumes at the same place it did.
      if (!spent) left.current = Math.max(0, wait - (Date.now() - startedAt));
    };
  }, [running, delay, id]);

  const restart = useCallback(() => {
    fresh.current = true;
    setId((current) => current + 1);
  }, []);

  return {
    beat: active && delay ? { duration: delay, running, id } : null,
    paused,
    setPaused,
    restart,
  };
}
