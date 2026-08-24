/**
 * Edge-safe session constants + the refresh call. Split out of
 * `lib/admin-auth.ts` because that file imports `next/headers`, which is
 * only valid in Server Components/Route Handlers — `middleware.ts` runs in
 * the Edge runtime and needs these without pulling that in.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_REFRESH_COOKIE = "admin_refresh";

export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

/**
 * Matches the backend's default `REFRESH_TOKEN_EXPIRE_HOURS` (see
 * `backend/.env.example`). Only bounds how long the browser holds the
 * cookies — the backend's own JWT expiry inside each token is what's
 * actually enforced.
 */
export const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 8;

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Calls the backend's `/api/auth/refresh` with a refresh_token and returns
 * a new (rotated) access/refresh pair, or null if the refresh token is
 * missing, expired, or otherwise rejected.
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshedTokens | null> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data = await res.json();
  return { accessToken: data.access_token, refreshToken: data.refresh_token };
}
