import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_REFRESH_COOKIE,
  BACKEND_API_URL,
  REFRESH_TOKEN_MAX_AGE_SECONDS,
} from "@/lib/admin-session";

/**
 * Proxies the login form to the FastAPI backend and stores the returned JWT
 * in an httpOnly cookie. The browser only ever talks to this same-origin
 * route — never directly to the backend — which sidesteps CORS entirely and
 * keeps the token out of reach of page JS.
 */
export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password) {
    return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
  } catch {
    return NextResponse.json({ error: "Сервер недоступен" }, { status: 502 });
  }

  if (!backendRes.ok) {
    return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
  }

  const data = await backendRes.json();
  const response = NextResponse.json({ ok: true });

  // Both cookies get the refresh token's lifetime as their outer bound —
  // the access cookie's *contents* are refreshed transparently by
  // `middleware.ts` well before the short-lived JWT inside it expires, so
  // there's no need to cap it at the access token's own 30-minute expiry.
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  };

  response.cookies.set(ADMIN_SESSION_COOKIE, data.access_token, cookieOptions);
  response.cookies.set(ADMIN_REFRESH_COOKIE, data.refresh_token, cookieOptions);

  return response;
}
