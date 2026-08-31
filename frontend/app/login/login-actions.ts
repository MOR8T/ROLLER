"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_REFRESH_COOKIE,
  BACKEND_API_URL,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/admin-session";

/**
 * Login as a Server Action rather than a client `fetch` to a route handler.
 *
 * The reason is the pre-hydration window: a bare `<form>` whose only submit
 * path is an `onSubmit` handler falls back to the browser default while the
 * page's JS is still loading, which is a GET to the current URL — putting the
 * password into the address bar, the browser history and the server's access
 * log (`/login?username=…&password=…`). A form pointed at a Server Action
 * posts, so there is no query-string fallback to leak into.
 *
 * Same trade as the old route handler otherwise: the browser never talks to
 * the FastAPI backend directly, and the JWT goes straight into an httpOnly
 * cookie without passing through page JS.
 */

/** Erased at compile time — a `"use server"` file may only export async functions. */
export interface LoginState {
  error: string | null;
}

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Введите логин и пароль" };
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "Сервер недоступен. Попробуйте ещё раз." };
  }

  if (!backendRes.ok) {
    return { error: "Неверный логин или пароль" };
  }

  const data = await backendRes.json();
  const cookieStore = await cookies();

  // Both cookies get the refresh token's lifetime as their outer bound — the
  // access cookie's *contents* are refreshed transparently by `proxy.ts` well
  // before the short-lived JWT inside it expires, so there's no need to cap it
  // at the access token's own 30-minute expiry.
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  };

  cookieStore.set(ADMIN_SESSION_COOKIE, data.access_token, cookieOptions);
  cookieStore.set(ADMIN_REFRESH_COOKIE, data.refresh_token, cookieOptions);

  // Throws — nothing below runs, and the `LoginState` return type is only
  // ever satisfied by the error paths above.
  redirect("/admin");
}
