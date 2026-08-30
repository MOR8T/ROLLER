"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";
import type { Locale } from "@/i18n/routing";

/**
 * Every mutation the products area makes, in one file — the same shape as
 * `product-categories-actions.ts`: the admin's bearer token is read
 * server-side from the httpOnly cookie, attached by `adminRequest`, and every
 * success busts both the admin page's own cache and the public `products`
 * tagged fetch so a change shows on the live site immediately rather than
 * waiting for its 60s revalidate.
 *
 * The product page is assembled in two steps, and so is this file: the product
 * itself (photo, title, description, categories) at the top, and its content
 * sections below.
 */

const LOCALES = ["ru", "tj", "en", "tr"] as const;

interface RawCategory {
  id: number;
  name_ru: string;
  name_tj: string;
  name_en: string;
  name_tr: string;
  image_path: string;
  position: number;
}

interface RawProduct {
  id: number;
  image_path: string | null;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  description_ru: string;
  description_tj: string;
  description_en: string;
  description_tr: string;
  position: number;
  categories: RawCategory[];
}

interface RawSection {
  id: number;
  type: string;
  position: number;
  content: Record<string, unknown>;
}

interface RawProductDetail extends RawProduct {
  sections: RawSection[];
}

/** The admin form edits all four locales at once, so the DTOs keep the full set. */
export interface AdminProductDto {
  id: number;
  titles: Record<Locale, string>;
  descriptions: Record<Locale, string>;
  imageSrc: string | null;
  categoryIds: number[];
}

export interface AdminProductSectionDto {
  id: number;
  type: string;
  position: number;
  /** The raw payload, exactly as stored — the per-type form knows its shape. */
  content: Record<string, unknown>;
}

export interface AdminProductDetailDto extends AdminProductDto {
  sections: AdminProductSectionDto[];
}

export interface AdminCategoryOptionDto {
  id: number;
  name: string;
}

/** Nothing to resolve — see the `/uploads` rewrite in `next.config.ts`. */
function resolveImageSrc(path: string): string {
  return path;
}

function localeMap(raw: object, field: string): Record<Locale, string> {
  const source = raw as Record<string, unknown>;

  return Object.fromEntries(
    LOCALES.map((locale) => [locale, String(source[`${field}_${locale}`] ?? "")]),
  ) as Record<Locale, string>;
}

function toDto(raw: RawProduct): AdminProductDto {
  return {
    id: raw.id,
    titles: localeMap(raw, "title"),
    descriptions: localeMap(raw, "description"),
    imageSrc: raw.image_path ? resolveImageSrc(raw.image_path) : null,
    categoryIds: raw.categories.map((category) => category.id),
  };
}

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/**
 * The one place that knows how to call the backend as the logged-in admin —
 * identical to `product-categories-actions.ts`'s helper, kept per-area rather
 * than shared so each area's actions file reads top to bottom on its own.
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

function revalidateProducts(productId?: number) {
  revalidatePath("/admin/products");
  if (productId !== undefined) revalidatePath(`/admin/products/${productId}`);
  // "max": stale-while-revalidate — the profile Next 16's `revalidateTag`
  // docs recommend. The two-argument form is required now.
  revalidateTag("products", "max");
}

// ── The product ────────────────────────────────────────────────────────────

export async function getAdminProducts(): Promise<AdminProductDto[]> {
  const result = await adminRequest<RawProduct[]>("/api/products", { cache: "no-store" });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map(toDto);
}

export async function getAdminProduct(id: number): Promise<AdminProductDetailDto | null> {
  const result = await adminRequest<RawProductDetail>(`/api/products/${id}`, {
    cache: "no-store",
  });
  if (!result.success) return null;

  return {
    ...toDto(result.data),
    sections: result.data.sections
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((section) => ({
        id: section.id,
        type: section.type,
        position: section.position,
        content: section.content,
      })),
  };
}

/** The category checkboxes on the product form, in the admin's own order. */
export async function getAdminCategoryOptions(): Promise<AdminCategoryOptionDto[]> {
  const result = await adminRequest<RawCategory[]>("/api/product-categories", {
    cache: "no-store",
  });
  if (!result.success) return [];

  return result.data
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((category) => ({ id: category.id, name: category.name_ru }));
}

export async function createProductAction(
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const result = await adminRequest<RawProduct>("/api/products", {
    method: "POST",
    body: formData,
  });
  if (!result.success) return result;

  revalidateProducts();
  // The id goes back to the caller so the manager can send the admin straight
  // into the new product's section editor — step two of the flow.
  return { success: true, data: { id: result.data.id } };
}

export async function updateProductAction(id: number, formData: FormData): Promise<ActionResult> {
  const result = await adminRequest(`/api/products/${id}`, { method: "PATCH", body: formData });
  if (result.success) revalidateProducts(id);
  return result;
}

export async function deleteProductAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/products/${id}`, { method: "DELETE" });
  if (result.success) revalidateProducts(id);
  return result;
}

export async function reorderProductsAction(orderedIds: number[]): Promise<ActionResult> {
  const result = await adminRequest("/api/products/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateProducts();
  return result;
}

// ── Its sections ───────────────────────────────────────────────────────────

/**
 * Uploads one image and returns the path to put inside a section payload.
 *
 * Section images go up one at a time and are referenced by path, rather than
 * riding along in the section's own request: a gallery holds an unknown number
 * of them, and a single form carrying both the files and the structure around
 * them is the version that gets fragile.
 */
export async function uploadSectionImageAction(
  formData: FormData,
): Promise<ActionResult<{ path: string }>> {
  return adminRequest<{ path: string }>("/api/products/uploads", {
    method: "POST",
    body: formData,
  });
}

export async function createSectionAction(
  productId: number,
  payload: { type: string; content: unknown },
): Promise<ActionResult> {
  const result = await adminRequest(`/api/products/${productId}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (result.success) revalidateProducts(productId);
  return result;
}

export async function updateSectionAction(
  productId: number,
  sectionId: number,
  payload: { type: string; content: unknown },
): Promise<ActionResult> {
  const result = await adminRequest(`/api/products/sections/${sectionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (result.success) revalidateProducts(productId);
  return result;
}

export async function deleteSectionAction(
  productId: number,
  sectionId: number,
): Promise<ActionResult> {
  const result = await adminRequest(`/api/products/sections/${sectionId}`, { method: "DELETE" });
  if (result.success) revalidateProducts(productId);
  return result;
}

/** The order of the sections *is* the layout of the product page. */
export async function reorderSectionsAction(
  productId: number,
  orderedIds: number[],
): Promise<ActionResult> {
  const result = await adminRequest(`/api/products/${productId}/sections/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ordered_ids: orderedIds }),
  });
  if (result.success) revalidateProducts(productId);
  return result;
}
