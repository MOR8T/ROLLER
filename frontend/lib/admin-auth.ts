import { cookies } from "next/headers";

/**
 * Server-only session helpers for the admin area (`app/admin`, `app/login`,
 * `app/api/auth/*`). The JWT itself lives only in an httpOnly cookie set by
 * `app/api/auth/login/route.ts` — it is never exposed to client-side JS, so
 * there is no localStorage/token-in-JS path anywhere in this app.
 */

export const ADMIN_SESSION_COOKIE = "admin_session";

export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://127.0.0.1:8000";

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
