import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` in the browser, `useEffect` during the server render.
 *
 * Both hero deck and the counting figures need to write to the DOM *before* the
 * browser paints — the deck to sit itself on the first real slide rather than on
 * the clone in front of it, the figures to start from zero rather than flashing
 * their final value. `useEffect` runs after the paint, which is one visible
 * frame of the wrong thing in both cases.
 *
 * React warns when `useLayoutEffect` is called during a server render, where it
 * does nothing, so the server gets `useEffect` instead. Hooks are matched by
 * position rather than by identity, and this is one hook in either environment.
 */
export const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;
