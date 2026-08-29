import { NextRequest, NextResponse } from "next/server";
import { BACKEND_API_URL } from "@/lib/admin-session";

/** Same proxy as `../route.ts`, for the short "Свяжитесь с нами" form. */
export async function POST(request: NextRequest) {
  const body = await request.text();

  let response: Response;
  try {
    response = await fetch(`${BACKEND_API_URL}/api/leads/quick`, {
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
