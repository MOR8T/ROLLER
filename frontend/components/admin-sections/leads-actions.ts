"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";

interface RawLead {
  id: number;
  kind: string;
  name: string | null;
  phone: string;
  scenario: string | null;
  city: string | null;
  product_type: string | null;
  comment: string | null;
  configuration: string | null;
  interests: string[] | null;
  context: string | null;
  message: string | null;
  is_reviewed: boolean;
  created_at: string;
}

export interface AdminLeadDto {
  id: number;
  kind: "full" | "quick";
  name: string | null;
  phone: string;
  scenario: string | null;
  city: string | null;
  productType: string | null;
  comment: string | null;
  configuration: string | null;
  interests: string[] | null;
  context: string | null;
  message: string | null;
  isReviewed: boolean;
  createdAt: string;
}

function toDto(raw: RawLead): AdminLeadDto {
  return {
    id: raw.id,
    kind: raw.kind === "quick" ? "quick" : "full",
    name: raw.name,
    phone: raw.phone,
    scenario: raw.scenario,
    city: raw.city,
    productType: raw.product_type,
    comment: raw.comment,
    configuration: raw.configuration,
    interests: raw.interests,
    context: raw.context,
    message: raw.message,
    isReviewed: raw.is_reviewed,
    createdAt: raw.created_at,
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

function revalidateLeads() {
  revalidatePath("/admin/leads");
}

export async function getAdminLeads(): Promise<AdminLeadDto[]> {
  const result = await adminRequest<RawLead[]>("/api/leads", { cache: "no-store" });
  if (!result.success) return [];

  return result.data.map(toDto);
}

export async function setLeadReviewedAction(id: number, reviewed: boolean): Promise<ActionResult> {
  const result = await adminRequest(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_reviewed: reviewed }),
  });
  if (result.success) revalidateLeads();
  return result;
}

export async function deleteLeadAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/leads/${id}`, { method: "DELETE" });
  if (result.success) revalidateLeads();
  return result;
}
