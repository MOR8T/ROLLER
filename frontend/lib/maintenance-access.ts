import "server-only";

import { cookies } from "next/headers";
import { BACKEND_API_URL } from "@/lib/admin-session";

/**
 * The way past «Сайт в разработке» for someone who is not an admin — the
 * client, a contractor, whoever needs to look at the real site while it is
 * closed. They click the logo plate on `MaintenanceScreen`, type the code the
 * admin set in «Настройки сайта», and this module remembers it.
 *
 * ⚠️ Not an authentication system, and must never grow into one. It unlocks
 * exactly one thing — the *rendering* of the public site while the switch is
 * on — and nothing under `/admin`, `/login` or `/api`, which sit outside
 * `[locale]` and never consult it. The admin session (`lib/admin-auth.ts`)
 * remains the only credential that can change anything.
 *
 * Why the cookie holds the code itself rather than a token:
 *   - it is httpOnly, so page JS never sees it, exactly like the admin JWT;
 *   - it is re-checked against the backend on every render, so an admin who
 *     changes or clears the code locks everyone out *at once* — there is no
 *     issued-token list to expire, revoke or forget to revoke;
 *   - a token would need shared signing material between Next and FastAPI,
 *     which this project does not have and would not be worth minting for a
 *     door code.
 */

/**
 * The cookie is written with **no `maxAge` and no `expires`**, which makes it
 * a session cookie: the browser drops it when it closes, and the next visit
 * lands back on the placeholder with the prompt.
 *
 * Deliberate, and the shortest lifetime a cookie can have. The alternative — a
 * dated cookie — would leave a laptop that someone borrows, or a phone handed
 * across a desk, holding a standing key to a site the client has not launched.
 * Retyping a short code is the cheaper side of that trade.
 *
 * ⚠️ Two things it does not do, both browser behaviour rather than something
 * this code can tighten:
 *   - closing one *tab* is not closing the browser — access survives until the
 *     last window goes. A cookie cannot be scoped to a tab; only `sessionStorage`
 *     can, and it is unreachable from the server that has to make this decision;
 *   - "continue where you left off" (Chrome) and session restore (Firefox) put
 *     session cookies back, so a browser configured that way keeps access
 *     across a restart.
 * Neither is a hole in the gate: the code is still re-checked against the
 * backend on every render, so clearing or changing it in «Настройки сайта»
 * ends every session at once, whatever the browser is holding.
 */
export const MAINTENANCE_PREVIEW_COOKIE = "roller_preview";

/**
 * Asks the backend whether `code` is the configured preview code.
 *
 * Fails **closed**, the opposite of `lib/site-settings.ts` and for the mirror
 * of its reason: that function decides whether to close the site, so its
 * failure mode must be "leave it open"; this one decides whether to open a
 * closed site, so its failure mode must be "leave it closed". A backend that
 * cannot answer has not said yes.
 */
export async function verifyPreviewCode(code: string | undefined): Promise<boolean> {
  const trimmed = code?.trim();
  if (!trimmed) return false;

  try {
    const res = await fetch(`${BACKEND_API_URL}/api/site-settings/preview-access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: trimmed }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;

    const data = (await res.json()) as { valid?: boolean };
    return data.valid === true;
  } catch {
    return false;
  }
}

/**
 * The preview code this request is carrying, if any. Reading it is separate
 * from checking it (`verifyPreviewCode` above) on purpose.
 *
 * ⚠️ **Call this unconditionally, before the maintenance switch is known.**
 * The two used to be one function that the layout called only when the switch
 * was on, so that an open site stayed statically rendered. That arrangement
 * broke the site the first time the switch was actually used in production
 * (2026-09-05):
 *
 *   - the image is built by CI, where the switch is off and the backend does
 *     not exist, so every public page compiled as a *static* route;
 *   - turning the switch on made those routes reach `cookies()` at runtime,
 *     which is a Request-time API a static route may not use. Every background
 *     regeneration then failed with `DYNAMIC_SERVER_USAGE`, Next threw the
 *     result away and kept serving the HTML baked at build time — the empty,
 *     backendless version of the site, with no placeholder and `index, follow`
 *     in its metadata. Routes with no baked copy (`/products/[category]` and
 *     the product page under it) answered 500 instead.
 *
 * A `cookies()` call that is *always* on the path is what fixes it: Next sees
 * it while building, marks everything under `app/[locale]` dynamic, and the
 * pages are rendered per request from then on — so the switch takes effect at
 * once, and so does every edit an admin makes, without another deploy. The
 * cost is bounded: the data behind those renders still comes from the tagged,
 * 60-second `fetch` cache in `lib/*.ts`, not from the backend each time.
 *
 * The verification POST stays conditional — `verifyPreviewCode` is only worth
 * calling on a closed site, and only for a visitor who actually holds a code.
 */
export async function readMaintenancePreviewCookie(): Promise<string | undefined> {
  return (await cookies()).get(MAINTENANCE_PREVIEW_COOKIE)?.value;
}
