"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import type { Locale } from "@/i18n/routing";

/**
 * The singleton counterpart to `partners-actions.ts`/`news-actions.ts` — one
 * row, so no create/delete/reorder, just read and partial-update. Same
 * shape as `about-content-actions.ts`, scaled down to the one field
 * (`address`) that is actually per-locale.
 */

interface RawContactInfo {
  id: number;
  address_ru: string;
  address_tj: string;
  address_en: string;
  address_tr: string;
  map_url: string;
  phone: string;
  email: string;
  whatsapp: string;
  social_instagram_url: string;
  social_instagram_enabled: boolean;
  social_telegram_url: string;
  social_telegram_enabled: boolean;
}

const LOCALES: Locale[] = ["ru", "tj", "en", "tr"];

export interface AdminContactInfoDto {
  id: number;
  address: Record<Locale, string>;
  mapUrl: string;
  phone: string;
  email: string;
  whatsapp: string;
  social: {
    instagram: { url: string; enabled: boolean };
    telegram: { url: string; enabled: boolean };
  };
}

function toDto(raw: RawContactInfo): AdminContactInfoDto {
  return {
    id: raw.id,
    address: {
      ru: raw.address_ru,
      tj: raw.address_tj,
      en: raw.address_en,
      tr: raw.address_tr,
    },
    mapUrl: raw.map_url,
    phone: raw.phone,
    email: raw.email,
    whatsapp: raw.whatsapp,
    social: {
      instagram: { url: raw.social_instagram_url, enabled: raw.social_instagram_enabled },
      telegram: { url: raw.social_telegram_url, enabled: raw.social_telegram_enabled },
    },
  };
}

/**
 * Reads every `name="address_ru"`-style field plus the flat fields the form
 * submits and turns them into the JSON body `ContactInfoUpdate` expects.
 * Checkboxes (`social_*_enabled`) are absent from `FormData` when unchecked
 * — presence, not value, is what `formData.has` reads.
 */
function toUpdatePayload(formData: FormData): Record<string, string | boolean> {
  const payload: Record<string, string | boolean> = {};

  for (const locale of LOCALES) {
    const value = formData.get(`address_${locale}`);
    if (typeof value === "string") payload[`address_${locale}`] = value;
  }

  for (const field of [
    "map_url",
    "phone",
    "email",
    "whatsapp",
    "social_instagram_url",
    "social_telegram_url",
  ] as const) {
    const value = formData.get(field);
    if (typeof value === "string") payload[field] = value;
  }

  payload.social_instagram_enabled = formData.has("social_instagram_enabled");
  payload.social_telegram_enabled = formData.has("social_telegram_enabled");

  return payload;
}

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/** Same helper as `about-content-actions.ts` — see its comment for why it exists. */
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

  return { success: true, data: (await res.json()) as T };
}

function revalidateContactInfo() {
  revalidatePath("/admin/contacts");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("contact-info", "max");
}

export async function getAdminContactInfo(): Promise<AdminContactInfoDto | null> {
  const result = await adminRequest<RawContactInfo>("/api/contact-info", {
    cache: "no-store",
  });
  return result.success ? toDto(result.data) : null;
}

export async function updateContactInfoAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/contact-info", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toUpdatePayload(formData)),
  });
  if (result.success) revalidateContactInfo();
  return result;
}
