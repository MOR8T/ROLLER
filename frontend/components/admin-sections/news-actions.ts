"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";
import type { Locale } from "@/i18n/routing";

/**
 * Every mutation here talks to the backend with the admin's bearer token —
 * read server-side from the httpOnly cookie, same as `lib/admin-auth.ts` —
 * through the single `adminRequest` helper below, and then busts both the
 * admin page's own cache and the public site's tagged `news` fetch
 * (`lib/news.ts`), so a change shows up on `/` and `/news` immediately
 * rather than waiting for its 60s revalidate.
 */

interface RawNewsArticle {
  id: number;
  slug: string;
  cover_path: string;
  published_at: string;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  excerpt_ru: string | null;
  excerpt_tj: string | null;
  excerpt_en: string | null;
  excerpt_tr: string | null;
  body_ru: string;
  body_tj: string;
  body_en: string;
  body_tr: string;
}

/**
 * The admin form edits all four locales at once, so — unlike the public
 * `NewsArticle` in `lib/news.ts`, which carries just the one locale's copy a
 * visitor needs — this DTO keeps the full set.
 */
export interface AdminNewsArticleDto {
  id: number;
  slug: string;
  coverSrc: string;
  publishedAt: string;
  titles: Record<Locale, string>;
  excerpts: Record<Locale, string>;
  bodies: Record<Locale, string>;
}

function toDto(raw: RawNewsArticle): AdminNewsArticleDto {
  return {
    id: raw.id,
    slug: raw.slug,
    coverSrc: raw.cover_path,
    publishedAt: raw.published_at,
    titles: { ru: raw.title_ru, tj: raw.title_tj, en: raw.title_en, tr: raw.title_tr },
    excerpts: {
      ru: raw.excerpt_ru ?? "",
      tj: raw.excerpt_tj ?? "",
      en: raw.excerpt_en ?? "",
      tr: raw.excerpt_tr ?? "",
    },
    bodies: { ru: raw.body_ru, tj: raw.body_tj, en: raw.body_en, tr: raw.body_tr },
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
    return { success: false, error: describeError(body) };
  }

  if (res.status === 204) return { success: true, data: undefined as T };

  return { success: true, data: (await res.json()) as T };
}

function revalidateNews() {
  revalidatePath("/admin/news");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("news", "max");
}

function sortByDateDesc(articles: RawNewsArticle[]): RawNewsArticle[] {
  return articles
    .slice()
    .sort((a, b) =>
      a.published_at < b.published_at ? 1 : a.published_at > b.published_at ? -1 : 0,
    );
}

export async function getAdminNews(): Promise<AdminNewsArticleDto[]> {
  const result = await adminRequest<RawNewsArticle[]>("/api/news", { cache: "no-store" });
  if (!result.success) return [];

  return sortByDateDesc(result.data).map(toDto);
}

export async function createNewsAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/news", { method: "POST", body: formData });
  if (result.success) revalidateNews();
  return result;
}

export async function updateNewsAction(id: number, formData: FormData): Promise<ActionResult> {
  const result = await adminRequest(`/api/news/${id}`, { method: "PATCH", body: formData });
  if (result.success) revalidateNews();
  return result;
}

export async function deleteNewsAction(id: number): Promise<ActionResult> {
  const result = await adminRequest(`/api/news/${id}`, { method: "DELETE" });
  if (result.success) revalidateNews();
  return result;
}
