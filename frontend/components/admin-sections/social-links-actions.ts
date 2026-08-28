"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";
import type { SocialNetwork } from "@/lib/social-networks";

/**
 * The footer's social-icons list — same list/reorder/edit/delete shape as
 * `contact-interests-actions.ts`, but the backend takes JSON (`SocialLink`
 * has no per-locale fields, so there's no `Form(...)` upload involved) rather
 * than `FormData`, same as `contact-info-actions.ts`'s `PATCH`.
 */

interface RawSocialLink {
  id: number;
  network: string;
  url: string;
  enabled: boolean;
  position: number;
}

export interface AdminSocialLinkDto {
  id: number;
  network: SocialNetwork;
  url: string;
  enabled: boolean;
  position: number;
}

function toDto(raw: RawSocialLink): AdminSocialLinkDto {
  return {
    id: raw.id,
    network: raw.network as SocialNetwork,
    url: raw.url,
    enabled: raw.enabled,
    position: raw.position,
  };
}

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/** Same helper as `contact-interests-actions.ts` — see its comment for why it exists. */
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

function revalidateSocialLinks() {
  revalidatePath("/admin/contacts");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("social-links", "max");
}

export async function getAdminSocialLinks(): Promise<AdminSocialLinkDto[]> {
  const result = await adminRequest<RawSocialLink[]>("/api/social-links", {
    cache: "no-store",
  });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toDto);
}

export async function createSocialLinkAction(
  network: SocialNetwork,
  url: string,
): Promise<ActionResult> {
  const result = await adminRequest("/api/social-links", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ network, url }),
  });
  if (result.success) revalidateSocialLinks();
  return result;
}

export async function updateSocialLinkAction(
  id: number,
  payload: { network?: SocialNetwork; url?: string; enabled?: boolean },
): Promise<ActionResult> {
  const result = await adminRequest(`/api/social-links/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (result.success) revalidateSocialLinks();
  return result;
}

export async function deleteSocialLinkAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/social-links/${id}`, { method: "DELETE" });
  if (result.success) revalidateSocialLinks();
  return result;
}

export async function reorderSocialLinksAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/social-links/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateSocialLinks();
  return result;
}
