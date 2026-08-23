"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import type { Locale } from "@/i18n/routing";

/**
 * Every mutation here talks to the backend with the admin's bearer token —
 * read server-side from the httpOnly cookie, same as `lib/admin-auth.ts` —
 * through the single `adminRequest` helper below, and then busts both the
 * admin page's own cache and the public homepage's tagged `hero-slides`
 * fetch (`lib/hero-slides.ts`), so a change shows up on the live site
 * immediately rather than waiting for its 60s revalidate.
 */

interface RawHeroSlide {
  id: number;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  image_path: string;
  product_link: string;
  position: number;
}

/**
 * The admin form edits all four locales at once, so — unlike the public
 * `HeroSlideDto` in `lib/hero-slides.ts`, which carries just the one title a
 * visitor needs — this DTO keeps the full set.
 */
export interface AdminHeroSlideDto {
  id: number;
  titles: Record<Locale, string>;
  imageSrc: string;
  productLink: string;
}

function toDto(raw: RawHeroSlide): AdminHeroSlideDto {
  return {
    id: raw.id,
    titles: { ru: raw.title_ru, tj: raw.title_tj, en: raw.title_en, tr: raw.title_tr },
    imageSrc: raw.image_path.startsWith("/uploads/")
      ? `${process.env.BACKEND_PUBLIC_URL ?? BACKEND_API_URL}${raw.image_path}`
      : raw.image_path,
    productLink: raw.product_link,
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
    return { success: false, error: body?.detail ?? "Не удалось выполнить запрос" };
  }

  if (res.status === 204) return { success: true, data: undefined as T };

  return { success: true, data: (await res.json()) as T };
}

function revalidateHeroSlides() {
  revalidatePath("/admin");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("hero-slides", "max");
}

export async function getAdminHeroSlides(): Promise<AdminHeroSlideDto[]> {
  const result = await adminRequest<RawHeroSlide[]>("/api/hero-slides", { cache: "no-store" });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toDto);
}

export async function createHeroSlideAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/hero-slides", { method: "POST", body: formData });
  if (result.success) revalidateHeroSlides();
  return result;
}

export async function updateHeroSlideAction(id: number, formData: FormData): Promise<ActionResult> {
  const result = await adminRequest(`/api/hero-slides/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (result.success) revalidateHeroSlides();
  return result;
}

export async function deleteHeroSlideAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/hero-slides/${id}`, { method: "DELETE" });
  if (result.success) revalidateHeroSlides();
  return result;
}

export async function reorderHeroSlidesAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/hero-slides/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateHeroSlides();
  return result;
}
