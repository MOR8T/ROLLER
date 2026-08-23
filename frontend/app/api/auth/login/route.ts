import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";

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

  response.cookies.set(ADMIN_SESSION_COOKIE, data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // An outer bound for the cookie itself — the backend's own JWT expiry
    // (30 min by default, see backend/.env) is the real access boundary,
    // checked on every request in `getAdminUser`.
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
