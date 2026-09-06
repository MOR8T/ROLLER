import "server-only";

import { headers } from "next/headers";

/**
 * The retry limit on the maintenance code prompt.
 *
 * It lives here, in the Next server, rather than in FastAPI — that is the
 * whole point of the 2026-09-06 rework described in `lib/maintenance-access.ts`.
 * The backend could only see the frontend container's IP and could not tell a
 * person typing at the prompt from the site re-checking a valid cookie on
 * every render, so it throttled the second and locked out the first. Here,
 * both are separable: only `unlockMaintenancePreview` ever calls this, once
 * per submitted form, and the per-render check does not come through at all.
 *
 * The escalation, as the client asked for it:
 *
 *   3 wrong codes  → wait 30s
 *   wrong again    → wait 60s
 *   wrong again    → wait 120s, then 240s, 480s… doubling with no ceiling
 *
 * i.e. the first lock costs three mistakes, because three is inside what a
 * person mistyping a code they actually have will do; after that the visitor
 * has demonstrated they are guessing, so every further miss locks immediately.
 * A correct code clears the record completely — the doubling never carries
 * over into the next session.
 *
 * ⚠️ In-process memory, deliberately, and with the same honesty the FastAPI
 * version had about it: state is per Node process, so several frontend
 * replicas would each keep their own, and a redeploy forgets everything. This
 * is a door code in front of a site that will be public — the job is to turn
 * "spray codes at network speed" into "type at human speed", not to survive a
 * distributed attacker. If it ever has to be real it belongs in Redis, not in
 * a module-level Map.
 */

/** Wrong codes tolerated before the first lock. */
const FAILURES_BEFORE_FIRST_LOCK = 3;

/** The first penalty; every subsequent one doubles it. */
const FIRST_PENALTY_MS = 30_000;

/**
 * A record with no lock left to serve and no recent activity is dropped after
 * this long, so the Map cannot grow without bound on a site that is being
 * crawled. Comfortably longer than any penalty a real visitor will sit
 * through — an attacker deep into the doubling has a `lockedUntil` far in the
 * future and is never pruned.
 */
const IDLE_TTL_MS = 60 * 60_000;

interface Attempts {
  /** Wrong codes since the last lock (or since the record was created). */
  failures: number;
  /** Epoch ms until which the prompt is closed; 0 when it is open. */
  lockedUntil: number;
  /** What the *next* lock will cost. Doubles each time one is served. */
  nextPenaltyMs: number;
  /** Epoch ms of the last attempt, for pruning only. */
  seenAt: number;
}

const attempts = new Map<string, Attempts>();

function prune(now: number): void {
  for (const [key, record] of attempts) {
    if (record.lockedUntil <= now && now - record.seenAt > IDLE_TTL_MS) {
      attempts.delete(key);
    }
  }
}

/**
 * Who is being throttled.
 *
 * `x-forwarded-for`'s first hop is the visitor: nginx sets it with
 * `$proxy_add_x_forwarded_for`, and `cloudflare-realip.inc` has already
 * restored the real address by then, so behind the proxy this is the browser's
 * IP and not Cloudflare's. `x-real-ip` is the fallback for a setup that only
 * sends that one.
 *
 * ⚠️ Spoofable in a deployment where nginx is bypassed — a direct caller can
 * put anything in the header and get a fresh bucket per request. Accepted, and
 * bounded: in production nothing reaches Next except through nginx, which
 * overwrites the header. It is worth no more hardening than the door it
 * guards.
 */
async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headerList.get("x-real-ip")?.trim() || "unknown";
}

/** Seconds still to wait, rounded up so a UI counter never shows a bare 0. */
function secondsUntil(until: number, now: number): number {
  return Math.max(1, Math.ceil((until - now) / 1000));
}

/**
 * Whether this visitor may try a code right now.
 *
 * Call it *before* comparing anything: a locked visitor's submission must not
 * be checked at all, or the lock would only be a delay on the answer rather
 * than on the guess.
 */
export async function checkPreviewThrottle(): Promise<
  { blocked: false } | { blocked: true; retryAfterSeconds: number }
> {
  const now = Date.now();
  prune(now);

  const record = attempts.get(await clientKey());
  if (!record || record.lockedUntil <= now) return { blocked: false };

  return { blocked: true, retryAfterSeconds: secondsUntil(record.lockedUntil, now) };
}

/**
 * Records a wrong code and reports whether that closed the prompt.
 *
 * `blocked: false` means the visitor still has tries left before the first
 * lock — the dialog shows a plain "wrong code" then, not a countdown.
 */
export async function recordPreviewFailure(): Promise<
  { blocked: false } | { blocked: true; retryAfterSeconds: number }
> {
  const now = Date.now();
  const key = await clientKey();

  const record: Attempts = attempts.get(key) ?? {
    failures: 0,
    lockedUntil: 0,
    nextPenaltyMs: FIRST_PENALTY_MS,
    seenAt: now,
  };
  record.failures += 1;
  record.seenAt = now;
  attempts.set(key, record);

  // Before the first lock the visitor gets three tries; after it, one. The
  // threshold is the count that has to accumulate, and it drops to 1 as soon
  // as `nextPenaltyMs` shows a lock has already been served.
  const threshold = record.nextPenaltyMs === FIRST_PENALTY_MS ? FAILURES_BEFORE_FIRST_LOCK : 1;
  if (record.failures < threshold) return { blocked: false };

  const penalty = record.nextPenaltyMs;
  record.failures = 0;
  record.lockedUntil = now + penalty;
  record.nextPenaltyMs = penalty * 2;

  return { blocked: true, retryAfterSeconds: secondsUntil(record.lockedUntil, now) };
}

/**
 * Forgets everything about this visitor. Called on a correct code, so the next
 * time they are asked — a new browser session, a changed code — they start
 * again at three tries and 30 seconds rather than wherever the doubling had
 * reached.
 */
export async function clearPreviewThrottle(): Promise<void> {
  attempts.delete(await clientKey());
}
