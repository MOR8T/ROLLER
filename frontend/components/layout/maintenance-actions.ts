"use server";

import { cookies } from "next/headers";
import { MAINTENANCE_PREVIEW_COOKIE, verifyPreviewCode } from "@/lib/maintenance-access";
import {
  checkPreviewThrottle,
  clearPreviewThrottle,
  recordPreviewFailure,
} from "@/lib/maintenance-throttle";

/**
 * The code prompt on `MaintenanceScreen`, submitted as a Server Action for
 * the same reason `app/login/login-actions.ts` is one: a `<form>` whose only
 * submit path is an `onSubmit` handler falls back to a GET while the page's
 * JS is still loading, which would put the code in the address bar, the
 * history and the access log. A form pointed at an action posts.
 *
 * The check itself is deliberately not a route handler — the browser never
 * talks to FastAPI directly anywhere in this app, and the cookie this sets is
 * httpOnly, so the code never passes through page JS on the way in either.
 *
 * This is also the *only* place the retry limit is applied. The per-render
 * re-check of the cookie in `app/[locale]/layout.tsx` and `lib/page-metadata.ts`
 * goes straight to `verifyPreviewCode` and is not counted — counting it is
 * precisely what used to lock a valid visitor out of the site they had just
 * unlocked (see `lib/maintenance-access.ts`).
 */

/** Erased at compile time — a `"use server"` file may only export async functions. */
export interface PreviewUnlockState {
  /**
   * `unlocked` is what the dialog watches for — it cannot infer success from
   * the absence of an error, since that is also the state the form starts in.
   * `throttled` carries a countdown instead of an error message.
   */
  status: "idle" | "invalid" | "throttled" | "unlocked";
  /** Only on `throttled`: seconds left before another code may be tried. */
  retryAfterSeconds?: number;
}

export async function unlockMaintenancePreview(
  _prevState: PreviewUnlockState,
  formData: FormData,
): Promise<PreviewUnlockState> {
  // Before the comparison, not after: a locked visitor's guess must not be
  // checked at all, or the lock would delay the answer instead of the guess.
  const gate = await checkPreviewThrottle();
  if (gate.blocked) {
    return { status: "throttled", retryAfterSeconds: gate.retryAfterSeconds };
  }

  const code = String(formData.get("code") ?? "");

  if (!(await verifyPreviewCode(code))) {
    const penalty = await recordPreviewFailure();
    // One state for "empty", "wrong" and "no code configured" on purpose: an
    // anonymous caller learns only that the door did not open. The countdown
    // is the one thing worth telling them, and only once it applies.
    return penalty.blocked
      ? { status: "throttled", retryAfterSeconds: penalty.retryAfterSeconds }
      : { status: "invalid" };
  }

  // A correct code wipes the record, so the escalation never carries over into
  // the next session.
  await clearPreviewThrottle();

  // No `maxAge`, no `expires` — a session cookie, gone when the browser
  // closes. See the note on `MAINTENANCE_PREVIEW_COOKIE` for why, and for the
  // two cases where a browser hands it back anyway.
  (await cookies()).set(MAINTENANCE_PREVIEW_COOKIE, code.trim(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  // No `redirect` — the visitor should land back where they were, which they
  // already are. The dialog reacts to this state with `router.refresh()`, and
  // the layout, re-running with the cookie in hand, renders the real site.
  return { status: "unlocked" };
}
