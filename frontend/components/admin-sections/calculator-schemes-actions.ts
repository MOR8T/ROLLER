"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";
import type { ConstructionKind, SchemeNode } from "@/lib/scheme-geometry";

export interface AdminSchemeDto {
  id: number;
  key: string;
  kind: ConstructionKind;
  columns: number;
  arch: number | null;
  geometry: SchemeNode;
  defaultWidthMm: number;
  defaultHeightMm: number;
  enabled: boolean;
  position: number;
}

interface RawAdminScheme extends Omit<AdminSchemeDto, "defaultWidthMm" | "defaultHeightMm"> {
  default_width_mm: number;
  default_height_mm: number;
}

function toDto(raw: RawAdminScheme): AdminSchemeDto {
  const { default_width_mm, default_height_mm, ...rest } = raw;
  return { ...rest, defaultWidthMm: default_width_mm, defaultHeightMm: default_height_mm };
}

/** The snake_case half of the payload the backend expects. */
function sizeFields(input: { defaultWidthMm?: number; defaultHeightMm?: number }) {
  return {
    default_width_mm: input.defaultWidthMm,
    default_height_mm: input.defaultHeightMm,
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

function revalidateSchemes() {
  revalidatePath("/admin/calculator");
  // The public calculator reads the enabled schemes, so disabling one has to
  // reach it too — see `lib/calculator-schemes.ts`'s fetch tag.
  revalidateTag("calculator-schemes", "max");
}

/** Every scheme, disabled ones included — `/all` rather than the public list. */
export async function getAdminSchemes(): Promise<AdminSchemeDto[]> {
  const result = await adminRequest<RawAdminScheme[]>("/api/calculator-schemes/all", {
    cache: "no-store",
  });
  if (!result.success) return [];
  return result.data.map(toDto);
}

export interface SchemeInput {
  key: string;
  kind: ConstructionKind;
  arch: number | null;
  geometry: SchemeNode;
  defaultWidthMm: number;
  defaultHeightMm: number;
  enabled: boolean;
}

export async function createSchemeAction(
  input: SchemeInput,
): Promise<ActionResult<AdminSchemeDto>> {
  const result = await adminRequest<RawAdminScheme>("/api/calculator-schemes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, ...sizeFields(input) }),
  });
  if (!result.success) return result;
  revalidateSchemes();
  return { success: true, data: toDto(result.data) };
}

export async function updateSchemeAction(
  id: number,
  input: Partial<Omit<SchemeInput, "key">>,
): Promise<ActionResult<AdminSchemeDto>> {
  const payload = { ...input, ...sizeFields(input) };
  const result = await adminRequest<RawAdminScheme>(`/api/calculator-schemes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    // `arch: null` means "square-headed" and an absent `arch` means "leave
    // it alone" — indistinguishable over JSON, hence the backend's separate
    // `clear_arch` flag. See `CalculatorSchemeUpdate`.
    body: JSON.stringify(
      input.arch === null ? { ...payload, arch: undefined, clear_arch: true } : payload,
    ),
  });
  if (!result.success) return result;
  revalidateSchemes();
  return { success: true, data: toDto(result.data) };
}

export async function deleteSchemeAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/calculator-schemes/${id}`, { method: "DELETE" });
  if (result.success) revalidateSchemes();
  return result;
}

export async function reorderSchemesAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/calculator-schemes/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateSchemes();
  return result;
}
