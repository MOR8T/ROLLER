"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import type { Locale } from "@/i18n/routing";

interface RawContactInterest {
  id: number;
  label_ru: string;
  label_tj: string;
  label_en: string;
  label_tr: string;
  position: number;
}

export interface AdminContactInterestDto {
  id: number;
  position: number;
  label: Record<Locale, string>;
}

function toDto(raw: RawContactInterest): AdminContactInterestDto {
  return {
    id: raw.id,
    position: raw.position,
    label: { ru: raw.label_ru, tj: raw.label_tj, en: raw.label_en, tr: raw.label_tr },
  };
}

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/** Same helper as `about-timeline-actions.ts` — see its comment for why it exists. */
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

function revalidateContactInterests() {
  revalidatePath("/admin/contacts");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("contact-interests", "max");
}

export async function getAdminContactInterests(): Promise<AdminContactInterestDto[]> {
  const result = await adminRequest<RawContactInterest[]>("/api/contact-interests", {
    cache: "no-store",
  });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toDto);
}

/** `formData` fields are named `label_ru` etc. — matches the backend's `Form(...)` names 1:1. */
export async function createContactInterestAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/contact-interests", { method: "POST", body: formData });
  if (result.success) revalidateContactInterests();
  return result;
}

export async function updateContactInterestAction(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const result = await adminRequest(`/api/contact-interests/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (result.success) revalidateContactInterests();
  return result;
}

export async function deleteContactInterestAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/contact-interests/${id}`, { method: "DELETE" });
  if (result.success) revalidateContactInterests();
  return result;
}

export async function reorderContactInterestsAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/contact-interests/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateContactInterests();
  return result;
}
