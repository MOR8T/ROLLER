"use server";

import { cookies } from "next/headers";
import { MAINTENANCE_PREVIEW_COOKIE, verifyPreviewCode } from "@/lib/maintenance-access";

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
 */

/** Erased at compile time — a `"use server"` file may only export async functions. */
export interface PreviewUnlockState {
  /**
   * `unlocked` is what the dialog watches for — it cannot infer success from
   * the absence of an error, since that is also the state the form starts in.
   */
  status: "idle" | "invalid" | "unlocked";
}

export async function unlockMaintenancePreview(
  _prevState: PreviewUnlockState,
  formData: FormData,
): Promise<PreviewUnlockState> {
  const code = String(formData.get("code") ?? "");

  if (!(await verifyPreviewCode(code))) {
    // One state for "empty", "wrong" and "backend down" on purpose: an
    // anonymous caller learns only that the door did not open.
    return { status: "invalid" };
  }

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
