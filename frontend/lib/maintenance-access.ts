import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
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
 *   - it is re-checked on every render against the code this module last read
 *     from the backend, so an admin who changes or clears the code locks
 *     everyone out *at once* — there is no issued-token list to expire, revoke
 *     or forget to revoke;
 *   - a token would need shared signing material between Next and FastAPI,
 *     which this project does not have and would not be worth minting for a
 *     door code.
 *
 * ⚠️ Where the comparison happens changed on 2026-09-06, and the reason is
 * worth keeping. It used to be a `POST /api/site-settings/preview-access` per
 * check — three per page view (this layout's `generateMetadata`, the layout
 * itself, and the page's own metadata through `lib/page-metadata.ts`), plus
 * three more for every link Next prefetched. FastAPI throttled that endpoint
 * at 10 attempts per 5 minutes, counted the *successful* re-checks too, and
 * bucketed them by caller IP — which, for server-to-server calls, is the
 * frontend container, i.e. one bucket shared by every visitor on the site.
 * Three or four page views exhausted it; the 429 then read as "wrong code"
 * (`verify` fails closed), so the placeholder came back and the *correct*
 * code was rejected for the next five minutes.
 *
 * So the code now comes here once per cache window and the comparison is
 * local: re-checks cost nothing and cannot be throttled, and the retry limit
 * that does still matter — a human guessing at the prompt — lives in
 * `lib/maintenance-throttle.ts`, where it counts only real attempts.
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
 * Neither is a hole in the gate: the code is still re-checked on every render,
 * so clearing or changing it in «Настройки сайта» ends every session at once,
 * whatever the browser is holding.
 */
export const MAINTENANCE_PREVIEW_COOKIE = "roller_preview";

/**
 * The shared secret that `GET /api/site-settings/preview-code` demands. Unset
 * on either side → no preview access at all, which is the safe direction: the
 * site stays closed rather than opening to a guess.
 */
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN ?? "";

/**
 * The code the admin has set, or `null` if there is none (or the backend could
 * not be asked).
 *
 * Cached under the `site-settings` tag, the same tag `lib/site-settings.ts`
 * uses and the same one `updatePreviewCodeAction` revalidates on save — so
 * changing the code in «Настройки сайта» invalidates this copy immediately and
 * every browser holding the old one is locked out on its next request. The 60s
 * `revalidate` is only the backstop for a change made outside the admin panel.
 *
 * ⚠️ This is a secret in the server's memory, and it must not become one in the
 * browser's: nothing here may be returned to a client component, put in a prop
 * or logged. `server-only` at the top of this file is what enforces the first
 * half of that; the rest is discipline.
 */
async function getPreviewCode(): Promise<string | null> {
  if (!INTERNAL_API_TOKEN) return null;

  try {
    const res = await fetch(`${BACKEND_API_URL}/api/site-settings/preview-code`, {
      headers: { "X-Internal-Token": INTERNAL_API_TOKEN },
      next: { revalidate: 60, tags: ["site-settings"] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { preview_code?: string | null };
    const code = data.preview_code?.trim();
    return code ? code : null;
  } catch {
    return null;
  }
}

/**
 * Constant-time string comparison.
 *
 * `timingSafeEqual` refuses buffers of different lengths, and comparing the
 * lengths first would leak the code's length through the error path — so both
 * sides are hashed to a fixed 32 bytes and the digests are compared instead.
 * The standard shape; the hash is not doing any secrecy work here.
 */
function constantTimeEquals(a: string, b: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();
  return timingSafeEqual(digest(a), digest(b));
}

/**
 * Whether `code` is the configured preview code.
 *
 * Fails **closed**, the opposite of `lib/site-settings.ts` and for the mirror
 * of its reason: that function decides whether to close the site, so its
 * failure mode must be "leave it open"; this one decides whether to open a
 * closed site, so its failure mode must be "leave it closed". No configured
 * code, no token, an unreachable backend — none of those are a yes.
 *
 * Cheap enough to call on every render: the network side is the tagged fetch
 * above, which answers from cache, and the rest is one SHA-256 of a few bytes.
 */
export async function verifyPreviewCode(code: string | undefined): Promise<boolean> {
  const trimmed = code?.trim();
  if (!trimmed) return false;

  const expected = await getPreviewCode();
  if (!expected) return false;

  return constantTimeEquals(trimmed, expected);
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
 * ⚠️ **"Next sees it while building" is conditional, and that condition bit
 * once more on 2026-09-06.** Next learns a route is dynamic by *rendering* it
 * during the build. A route with `generateStaticParams` is only rendered for
 * the params that function returns — so when `productParams()`,
 * `productCategoryParams()` and `newsParams()` came back empty (CI builds the
 * image with no backend reachable, and all three fail soft to `[]`), those
 * three routes were never rendered, this call was never observed, and they
 * were filed as static while every other page under `app/[locale]` was
 * correctly dynamic. In production each request then threw
 * `DYNAMIC_SERVER_USAGE` here, and with an empty param list there was no
 * prerendered HTML to serve instead — so `/products/[category]`,
 * `/products/[category]/[product]` and `/news/[article]` answered a bare
 * `Internal Server Error` while the rest of the site was fine.
 *
 * So: **no route under `app/[locale]` may declare `generateStaticParams`**
 * while this call is on its path. Nothing here is prerendered anyway — that is
 * the whole point of the paragraph above — so such a function buys nothing and
 * silently reclassifies the route. `app/sitemap.ts` still calls the two
 * `lib/products.ts` helpers, which is fine: it is a genuinely static route
 * that never reaches this cookie.
 */
export async function readMaintenancePreviewCookie(): Promise<string | undefined> {
  return (await cookies()).get(MAINTENANCE_PREVIEW_COOKIE)?.value;
}
