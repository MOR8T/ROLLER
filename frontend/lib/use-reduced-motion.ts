import { useEffect, useState } from "react";

/**
 * `prefers-reduced-motion: reduce` as state, for the decisions CSS cannot make.
 *
 * Most of the site answers this query in the stylesheet — `motion-safe:` and
 * `motion-reduce:` variants, and the guards in `globals.css`. The sliders need
 * it in JavaScript as well: whether a deck plays itself, and whether a turn
 * animates or cuts, are decisions taken before any class is written.
 *
 * Starts `false` and settles in an effect, because the server has no media
 * queries to read and a hydration mismatch here would cost more than the one
 * frame of motion it saves. It also listens for changes, so a visitor turning
 * the setting on in the OS quiets the page without a reload.
 */
export function useReducedMotion(): boolean {
  const [still, setStill] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return still;
}
