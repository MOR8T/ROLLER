"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";

/**
 * Every mutation here talks to the backend with the admin's bearer token —
 * read server-side from the httpOnly cookie, same as `lib/admin-auth.ts` —
 * through the single `adminRequest` helper below, and then busts both the
 * admin page's own cache and the public `PartnersSection`'s tagged fetch
 * (`lib/partners.ts`), so a change shows up on the live site immediately
 * rather than waiting for its 60s revalidate.
 */

interface RawPartner {
  id: number;
  name: string;
  logo_path: string;
  position: number;
}

export interface AdminPartnerDto {
  id: number;
  name: string;
  logoSrc: string;
}

function toDto(raw: RawPartner): AdminPartnerDto {
  return {
    id: raw.id,
    name: raw.name,
    logoSrc: raw.logo_path.startsWith("/uploads/")
      ? `${process.env.BACKEND_PUBLIC_URL ?? BACKEND_API_URL}${raw.logo_path}`
      : raw.logo_path,
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

function revalidatePartners() {
  revalidatePath("/admin/about");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("partners", "max");
}

export async function getAdminPartners(): Promise<AdminPartnerDto[]> {
  const result = await adminRequest<RawPartner[]>("/api/partners", { cache: "no-store" });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toDto);
}

export async function createPartnerAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/partners", { method: "POST", body: formData });
  if (result.success) revalidatePartners();
  return result;
}

export async function updatePartnerAction(id: number, formData: FormData): Promise<ActionResult> {
  const result = await adminRequest(`/api/partners/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (result.success) revalidatePartners();
  return result;
}

export async function deletePartnerAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/partners/${id}`, { method: "DELETE" });
  if (result.success) revalidatePartners();
  return result;
}

export async function reorderPartnersAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/partners/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidatePartners();
  return result;
}
