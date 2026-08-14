"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter } from "next-intl";

import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

/** ease-out-cubic — fast at the start, settles at the end. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface CountUpProps {
  value: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
}

/**
 * A number that counts up to its value the first time it is scrolled into view.
 *
 * ⚠️ This is an override of DESIGN.md §8, which sanctions motion only where it
 * explains the product and calls out a counting number as the example of motion
 * that explains nothing. The client asked for it on 2026-08-13. The override is
 * kept narrow: the homepage's four figures only, once each, no repeat on
 * scrolling back.
 *
 * ── What it does not break ──────────────────────────────────────────────────
 *
 * The final number is what the server renders, so the markup a crawler and a
 * reader-mode see is "10 000+", never "0". Formatting goes through `next-intl`
 * rather than `toLocaleString` so the grouping separator resolves the same on
 * both sides — "10 000" in Russian, "10,000" in English — and the hydration
 * mismatch a bare `toLocaleString` risks cannot occur.
 *
 * `prefers-reduced-motion` skips the whole thing and leaves the number where it
 * started, which is already the right answer.
 */
export function CountUp({ value, suffix = "", durationMs = 1400, className }: CountUpProps) {
  const format = useFormatter();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  // Two effects, and the split is the point. This one runs before paint and
  // decides whether the animation is going to happen at all; the one below
  // waits for the element to be on screen. Merging them would mean either
  // resetting to zero after a paint (the flash) or observing before knowing
  // whether motion is wanted.
  const animates = useRef(false);

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    animates.current = true;
    setShown(0);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node || !animates.current) return;

    let frame = 0;

    const run = () => {
      const start = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - start) / durationMs, 1);
        setShown(Math.round(value * easeOut(progress)));
        if (progress < 1) frame = requestAnimationFrame(step);
      };

      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        // Once. Counting up again every time the visitor scrolls past is the
        // version of this that becomes annoying on the second pass.
        observer.disconnect();
        run();
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {format.number(shown)}
      {suffix}
    </span>
  );
}
