"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  unlockMaintenancePreview,
  type PreviewUnlockState,
} from "@/components/layout/maintenance-actions";

/**
 * The code prompt behind `MaintenanceScreen`'s logo plate.
 *
 * Deliberately *not* `components/ui/modal.tsx`. That dialog is part of the
 * site's design system — light surface, brand tokens, `rounded-card` — and
 * this screen is the thing that replaces the site: it owns its own dark
 * palette (see the "Maintenance screen" block in `app/globals.css`, which
 * this shares), so reusing the site modal here would open a bright white
 * panel over a page that has none of it.
 *
 * The form posts to a Server Action rather than fetching, so it works before
 * hydration; `useActionState` is only what renders the error and the pending
 * state on top of that.
 */

const INITIAL_STATE: PreviewUnlockState = { status: "idle" };

export function MaintenanceAccessDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("maintenance");
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(unlockMaintenancePreview, INITIAL_STATE);

  /**
   * Seconds left on the retry lock (`lib/maintenance-throttle.ts`), counted
   * down here rather than re-asked from the server: the action already
   * returned the figure, and a ticking number is the difference between "the
   * form is broken" and "wait a moment".
   *
   * The server is still the authority — it re-checks the lock on the next
   * submit — so a visitor who edits this number in React DevTools only gets
   * the same `throttled` answer back a second later.
   */
  const [remaining, setRemaining] = useState(0);
  const locked = remaining > 0;

  // Reset during render rather than in an effect — React's own "adjusting
  // state when props change" pattern. An effect here would paint one frame of
  // the previous countdown before correcting it, and `react-hooks` rightly
  // flags the cascading render.
  const [seenState, setSeenState] = useState(state);
  if (seenState !== state) {
    setSeenState(state);
    setRemaining(state.status === "throttled" ? (state.retryAfterSeconds ?? 0) : 0);
  }

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  // Escape to close, scroll locked while open, focus into the field — the same
  // contract `components/ui/modal.tsx` gives every other dialog on the site.
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", escape);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    return () => {
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  // The cookie is set by the time the action resolves, but this tree was
  // rendered without it. `refresh()` re-runs the layout, which now finds the
  // cookie, skips the placeholder and streams the real site into the same
  // page — no reload, no redirect, and the visitor keeps the URL they came in
  // on rather than being dropped on the homepage.
  useEffect(() => {
    if (state.status === "unlocked") router.refresh();
  }, [state.status, router]);

  const invalid = state.status === "invalid";
  const message = locked
    ? t("accessThrottled", { seconds: remaining })
    : invalid
      ? t("accessError")
      : null;

  return (
    <div
      className="maintenance-dialog-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-dialog-title"
        className="maintenance-dialog"
      >
        <button
          type="button"
          className="maintenance-dialog-close"
          aria-label={t("accessClose")}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </button>

        <h2 id="maintenance-dialog-title" className="maintenance-dialog-title">
          {t("accessTitle")}
        </h2>
        <p className="maintenance-dialog-text">{t("accessDescription")}</p>

        <form action={formAction} className="maintenance-dialog-form">
          <label className="maintenance-dialog-label" htmlFor="maintenance-code">
            {t("accessLabel")}
          </label>
          <input
            ref={input}
            id="maintenance-code"
            name="code"
            type="password"
            autoComplete="off"
            // Latin-first: the codes the admin hands out are typed on phones
            // whose keyboard would otherwise open in Cyrillic on `ru`.
            inputMode="text"
            spellCheck={false}
            required
            maxLength={64}
            className="maintenance-dialog-input"
            aria-invalid={invalid || locked}
            aria-describedby={message ? "maintenance-code-error" : undefined}
          />

          {message ? (
            // `aria-live` rather than `role="alert"` while the countdown runs:
            // an alert re-announces on every render, which would read the
            // remaining seconds aloud once a second.
            <p
              id="maintenance-code-error"
              role={locked ? undefined : "alert"}
              aria-live={locked ? "polite" : undefined}
              className="maintenance-dialog-error"
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            className="maintenance-dialog-submit"
            disabled={isPending || locked}
          >
            {isPending ? t("accessPending") : t("accessSubmit")}
          </button>
        </form>
      </div>
    </div>
  );
}
