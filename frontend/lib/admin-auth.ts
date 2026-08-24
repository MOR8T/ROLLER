import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-session";

/**
 * Server-only session helpers for the admin area (`app/admin`, `app/login`,
 * `app/api/auth/*`). The JWT itself lives only in an httpOnly cookie set by
 * `app/api/auth/login/route.ts` — it is never exposed to client-side JS, so
 * there is no localStorage/token-in-JS path anywhere in this app.
 *
 * The cookie name and refresh call live in `lib/admin-session.ts` instead of
 * here, and are re-exported below, because `middleware.ts` (Edge runtime)
 * needs them too and can't import this file's `next/headers` usage.
 */

export { ADMIN_SESSION_COOKIE, BACKEND_API_URL };

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
}

/**
 * Reads the session cookie and confirms it against the backend's `/api/users/me`.
 * Returns null for a missing, expired, or otherwise rejected token — callers
 * treat null as "not logged in", they never need to distinguish the reason.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const data = await res.json();
  return { id: data.id, username: data.username, email: data.email, isActive: data.is_active };
}
