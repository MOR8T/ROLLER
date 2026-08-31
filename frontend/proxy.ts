import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_REFRESH_COOKIE,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
  refreshAccessToken,
} from "@/lib/admin-session";

const intlProxy = createMiddleware(routing);

// How much life an access token needs left before we stop bothering to
// refresh it early — avoids a refresh call on literally every admin request.
const REFRESH_BUFFER_SECONDS = 30;

/**
 * Reads the `exp` claim without verifying the signature — just a heuristic
 * for "is it worth trying a refresh", not an auth decision. The backend
 * still verifies the token for real on every `/api/*` call it receives.
 */
function isAccessTokenExpiring(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof json.exp !== "number") return true;
    return Date.now() >= json.exp * 1000 - REFRESH_BUFFER_SECONDS * 1000;
  } catch {
    return true;
  }
}

/**
 * Silently refreshes the admin session before the short-lived access token
 * expires, so an admin actively using the panel is never kicked to
 * `/login` mid-session. Runs ahead of every `/admin/*` request (including
 * the POST a Server Action makes to its own page) — see the `config.matcher`
 * below, which now lets `/admin` through instead of excluding it.
 *
 * This only sets cookies; it never redirects. `getAdminUser()` in
 * `lib/admin-auth.ts` (called from `app/admin/(dashboard)/layout.tsx`)
 * stays the single source of truth for "is this a valid session" and owns
 * the redirect to `/login`.
 */
async function handleAdminSession(request: NextRequest): Promise<NextResponse> {
  const accessToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const refreshToken = request.cookies.get(ADMIN_REFRESH_COOKIE)?.value;

  if (!refreshToken || !isAccessTokenExpiring(accessToken)) {
    return NextResponse.next();
  }

  const refreshed = await refreshAccessToken(refreshToken);

  if (!refreshed) {
    // Refresh token is gone/expired/rejected — clear both cookies and let
    // `getAdminUser()` fail its own check and redirect to `/login` as before.
    const response = NextResponse.next();
    response.cookies.delete(ADMIN_SESSION_COOKIE);
    response.cookies.delete(ADMIN_REFRESH_COOKIE);
    return response;
  }

  // Forward the new tokens to the current request's own render (so
  // `getAdminUser()` sees a fresh cookie this same request)...
  request.cookies.set(ADMIN_SESSION_COOKIE, refreshed.accessToken);
  request.cookies.set(ADMIN_REFRESH_COOKIE, refreshed.refreshToken);

  // ...and persist them to the browser for subsequent requests.
  const response = NextResponse.next({ request });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  };
  response.cookies.set(ADMIN_SESSION_COOKIE, refreshed.accessToken, cookieOptions);
  response.cookies.set(ADMIN_REFRESH_COOKIE, refreshed.refreshToken, cookieOptions);
  return response;
}

export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return handleAdminSession(request);
  }
  return intlProxy(request);
}

export const config = {
  // `login` stays excluded: it lives outside `app/[locale]` and is not part
  // of the localized site, so the intl proxy must not try to redirect it to
  // a locale-prefixed path (e.g. `/login` -> `/ru/login`).
  // `admin` is now included (it was excluded before this file did anything
  // but intl routing) so `proxy()` above can run the session-refresh branch
  // for it instead.
  matcher: "/((?!api|login|_next|_vercel|.*\\..*).*)",
};
