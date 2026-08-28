"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";
import type { Locale } from "@/i18n/routing";

interface RawAboutTimelineItem {
  id: number;
  year_ru: string;
  year_tj: string;
  year_en: string;
  year_tr: string;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  description_ru: string;
  description_tj: string;
  description_en: string;
  description_tr: string;
  position: number;
}

export interface AdminAboutTimelineItemDto {
  id: number;
  position: number;
  year: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
}

function toDto(raw: RawAboutTimelineItem): AdminAboutTimelineItemDto {
  return {
    id: raw.id,
    position: raw.position,
    year: { ru: raw.year_ru, tj: raw.year_tj, en: raw.year_en, tr: raw.year_tr },
    title: { ru: raw.title_ru, tj: raw.title_tj, en: raw.title_en, tr: raw.title_tr },
    description: {
      ru: raw.description_ru,
      tj: raw.description_tj,
      en: raw.description_en,
      tr: raw.description_tr,
    },
  };
}

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/** Same helper as `partners-actions.ts` — see its comment for why it exists. */
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

function revalidateAboutTimeline() {
  revalidatePath("/admin/about");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("about-timeline", "max");
}

export async function getAdminAboutTimeline(): Promise<AdminAboutTimelineItemDto[]> {
  const result = await adminRequest<RawAboutTimelineItem[]>("/api/about-timeline", {
    cache: "no-store",
  });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toDto);
}

/** `formData` fields are named `year_ru`/`title_ru`/`description_ru` etc. — matches the backend's `Form(...)` names 1:1, so no translation layer is needed here. */
export async function createTimelineItemAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/about-timeline", { method: "POST", body: formData });
  if (result.success) revalidateAboutTimeline();
  return result;
}

export async function updateTimelineItemAction(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const result = await adminRequest(`/api/about-timeline/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (result.success) revalidateAboutTimeline();
  return result;
}

export async function deleteTimelineItemAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/about-timeline/${id}`, { method: "DELETE" });
  if (result.success) revalidateAboutTimeline();
  return result;
}

export async function reorderTimelineItemsAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/about-timeline/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateAboutTimeline();
  return result;
}
