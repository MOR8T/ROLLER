"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";
import type { Locale } from "@/i18n/routing";

/**
 * Every mutation here talks to the backend with the admin's bearer token —
 * read server-side from the httpOnly cookie, same as `lib/admin-auth.ts` —
 * through the single `adminRequest` helper below, and then busts both the
 * admin page's own cache and the public `showrooms` tagged fetch
 * (`lib/showrooms.ts`), so a change shows up on the live site immediately
 * rather than waiting for its 60s revalidate.
 */

interface RawShowroom {
  id: number;
  city_ru: string;
  city_tj: string;
  city_en: string;
  city_tr: string;
  address_ru: string;
  address_tj: string;
  address_en: string;
  address_tr: string;
  hours_ru: string;
  hours_tj: string;
  hours_en: string;
  hours_tr: string;
  phone: string;
  lat: number;
  lng: number;
  route_url: string;
  photo_path: string;
  position: number;
}

/**
 * The admin form edits all four locales at once, so this DTO keeps the full
 * set rather than the one a visitor needs.
 */
export interface AdminShowroomDto {
  id: number;
  cities: Record<Locale, string>;
  addresses: Record<Locale, string>;
  hours: Record<Locale, string>;
  phone: string;
  lat: number;
  lng: number;
  routeUrl: string;
  photoSrc: string;
}

function toDto(raw: RawShowroom): AdminShowroomDto {
  return {
    id: raw.id,
    cities: { ru: raw.city_ru, tj: raw.city_tj, en: raw.city_en, tr: raw.city_tr },
    addresses: { ru: raw.address_ru, tj: raw.address_tj, en: raw.address_en, tr: raw.address_tr },
    hours: { ru: raw.hours_ru, tj: raw.hours_tj, en: raw.hours_en, tr: raw.hours_tr },
    phone: raw.phone,
    lat: raw.lat,
    lng: raw.lng,
    routeUrl: raw.route_url,
    photoSrc: raw.photo_path,
  };
}

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/**
 * The one place that knows how to call the backend as the logged-in admin:
 * reads the session cookie, attaches the bearer token, and turns a missing
 * token / network failure / non-2xx response into the same `ActionResult`
 * shape every caller below already returns — so none of them duplicate that
 * plumbing themselves.
 */
async function adminRequest<T = undefined>(
  path: string,
  init: RequestInit = {},
): Promise<ActionResult<T>> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return { success: false, error: "Сессия истекла — войдите заново" };

  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch {
    return { success: false, error: "Не удалось связаться с сервером" };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { success: false, error: describeError(body) };
  }

  if (res.status === 204) return { success: true, data: undefined as T };

  return { success: true, data: (await res.json()) as T };
}

function revalidateShowrooms() {
  revalidatePath("/admin/showrooms");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("showrooms", "max");
}

export async function getAdminShowrooms(): Promise<AdminShowroomDto[]> {
  const result = await adminRequest<RawShowroom[]>("/api/showrooms", { cache: "no-store" });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toDto);
}

export async function createShowroomAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/showrooms", { method: "POST", body: formData });
  if (result.success) revalidateShowrooms();
  return result;
}

export async function updateShowroomAction(id: number, formData: FormData): Promise<ActionResult> {
  const result = await adminRequest(`/api/showrooms/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (result.success) revalidateShowrooms();
  return result;
}

export async function deleteShowroomAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/showrooms/${id}`, { method: "DELETE" });
  if (result.success) revalidateShowrooms();
  return result;
}

export async function reorderShowroomsAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/showrooms/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateShowrooms();
  return result;
}
