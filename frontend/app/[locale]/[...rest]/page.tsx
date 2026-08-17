import { notFound } from "next/navigation";

/**
 * Catch-all under `[locale]`, so an unknown path renders the *localized* 404
 * from `app/[locale]/not-found.tsx` instead of Next's built-in English one.
 *
 * Without it every 404 on the site — `/tg/katalog`, a stale link, a typo —
 * lands on an unstyled English page with no header, no footer and no way back,
 * on all four locales.
 *
 * Real routes take precedence: once `app/[locale]/products/page.tsx` exists
 * (stage 04) Next matches the more specific segment and never reaches here.
 */
export default function CatchAllNotFound() {
  notFound();
}
