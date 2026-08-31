import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_URL } from "@/lib/admin-session";

/**
 * Proxies the calculator/quote/dealer request form to the backend.
 *
 * `lib/leads.ts`'s `submitLead` runs in the browser, which has no
 * `BACKEND_API_URL` to call directly — only server code reads that env var.
 * Behind the production nginx this route never actually runs (`/api/*` is
 * proxied straight to the backend there, same path, so the browser's request
 * never reaches Next.js); it exists so the same relative `/api/leads` call
 * also works against `next dev`, which has no such proxy in front of it.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();

  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_URL}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch {
    return NextResponse.json({ detail: "Не удалось связаться с сервером" }, { status: 502 });
  }

  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}
