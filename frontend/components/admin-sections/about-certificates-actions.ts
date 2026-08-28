"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";
import type { Locale } from "@/i18n/routing";

interface RawAboutCertificate {
  id: number;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  image_path: string;
  position: number;
}

export interface AdminAboutCertificateDto {
  id: number;
  position: number;
  title: Record<Locale, string>;
  imageSrc: string;
}

function toDto(raw: RawAboutCertificate): AdminAboutCertificateDto {
  return {
    id: raw.id,
    position: raw.position,
    title: { ru: raw.title_ru, tj: raw.title_tj, en: raw.title_en, tr: raw.title_tr },
    imageSrc: raw.image_path.startsWith("/uploads/")
      ? `${process.env.BACKEND_PUBLIC_URL ?? BACKEND_API_URL}${raw.image_path}`
      : raw.image_path,
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

function revalidateAboutCertificates() {
  revalidatePath("/admin/about");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("about-certificates", "max");
}

export async function getAdminAboutCertificates(): Promise<AdminAboutCertificateDto[]> {
  const result = await adminRequest<RawAboutCertificate[]>("/api/about-certificates", {
    cache: "no-store",
  });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toDto);
}

/** `formData` fields are named `title_ru`/`image` etc. — matches the backend's `Form(...)`/`File(...)` names 1:1, so no translation layer is needed here. */
export async function createCertificateAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/about-certificates", {
    method: "POST",
    body: formData,
  });
  if (result.success) revalidateAboutCertificates();
  return result;
}

export async function updateCertificateAction(
  id: number,
  formData: FormData,
): Promise<ActionResult> {
  const result = await adminRequest(`/api/about-certificates/${id}`, {
    method: "PATCH",
    body: formData,
  });
  if (result.success) revalidateAboutCertificates();
  return result;
}

export async function deleteCertificateAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/about-certificates/${id}`, { method: "DELETE" });
  if (result.success) revalidateAboutCertificates();
  return result;
}

export async function reorderCertificatesAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/about-certificates/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateAboutCertificates();
  return result;
}
