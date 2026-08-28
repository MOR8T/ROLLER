"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";
import type { Locale } from "@/i18n/routing";

/**
 * The singleton counterpart to `partners-actions.ts`/`news-actions.ts` — one
 * row, so no create/delete/reorder, just read and partial-update. Same
 * `Record<Locale, string>` shape `news-actions.ts`'s `titles`/`excerpts`/
 * `bodies` use, so the manager form reads `content.heroTitle[locale]` the
 * same way `ArticleFields` reads `article.titles[locale]`.
 */

interface RawAboutContent {
  id: number;
  hero_title_ru: string;
  hero_title_tj: string;
  hero_title_en: string;
  hero_title_tr: string;
  hero_description_ru: string;
  hero_description_tj: string;
  hero_description_en: string;
  hero_description_tr: string;
  story_title_ru: string;
  story_title_tj: string;
  story_title_en: string;
  story_title_tr: string;
  story_paragraphs_ru: string;
  story_paragraphs_tj: string;
  story_paragraphs_en: string;
  story_paragraphs_tr: string;
  timeline_title_ru: string;
  timeline_title_tj: string;
  timeline_title_en: string;
  timeline_title_tr: string;
  timeline_description_ru: string;
  timeline_description_tj: string;
  timeline_description_en: string;
  timeline_description_tr: string;
  certificates_title_ru: string;
  certificates_title_tj: string;
  certificates_title_en: string;
  certificates_title_tr: string;
  certificates_description_ru: string;
  certificates_description_tj: string;
  certificates_description_en: string;
  certificates_description_tr: string;
  clients_title_ru: string;
  clients_title_tj: string;
  clients_title_en: string;
  clients_title_tr: string;
  clients_quote_ru: string;
  clients_quote_tj: string;
  clients_quote_en: string;
  clients_quote_tr: string;
  stat_years_value: number;
  stat_years_suffix: string;
  stat_projects_value: number;
  stat_projects_suffix: string;
  stat_employees_value: number;
  stat_employees_suffix: string;
  stat_tonnage_value: number;
  stat_tonnage_suffix: string;
}

/** One concept ("hero title", "story paragraphs", ...) across all 4 locales. */
type LocalizedField =
  | "heroTitle"
  | "heroDescription"
  | "storyTitle"
  | "storyParagraphs"
  | "timelineTitle"
  | "timelineDescription"
  | "certificatesTitle"
  | "certificatesDescription"
  | "clientsTitle"
  | "clientsQuote";

const FIELD_TO_COLUMN: Record<LocalizedField, string> = {
  heroTitle: "hero_title",
  heroDescription: "hero_description",
  storyTitle: "story_title",
  storyParagraphs: "story_paragraphs",
  timelineTitle: "timeline_title",
  timelineDescription: "timeline_description",
  certificatesTitle: "certificates_title",
  certificatesDescription: "certificates_description",
  clientsTitle: "clients_title",
  clientsQuote: "clients_quote",
};

const LOCALES: Locale[] = ["ru", "tj", "en", "tr"];

export interface AdminAboutContentDto {
  id: number;
  heroTitle: Record<Locale, string>;
  heroDescription: Record<Locale, string>;
  storyTitle: Record<Locale, string>;
  storyParagraphs: Record<Locale, string>;
  timelineTitle: Record<Locale, string>;
  timelineDescription: Record<Locale, string>;
  certificatesTitle: Record<Locale, string>;
  certificatesDescription: Record<Locale, string>;
  clientsTitle: Record<Locale, string>;
  clientsQuote: Record<Locale, string>;
  stats: {
    years: { value: number; suffix: string };
    projects: { value: number; suffix: string };
    employees: { value: number; suffix: string };
    tonnage: { value: number; suffix: string };
  };
}

function toDto(raw: RawAboutContent): AdminAboutContentDto {
  const localized = (field: LocalizedField): Record<Locale, string> => {
    const column = FIELD_TO_COLUMN[field];
    return {
      ru: raw[`${column}_ru` as keyof RawAboutContent] as string,
      tj: raw[`${column}_tj` as keyof RawAboutContent] as string,
      en: raw[`${column}_en` as keyof RawAboutContent] as string,
      tr: raw[`${column}_tr` as keyof RawAboutContent] as string,
    };
  };

  return {
    id: raw.id,
    heroTitle: localized("heroTitle"),
    heroDescription: localized("heroDescription"),
    storyTitle: localized("storyTitle"),
    storyParagraphs: localized("storyParagraphs"),
    timelineTitle: localized("timelineTitle"),
    timelineDescription: localized("timelineDescription"),
    certificatesTitle: localized("certificatesTitle"),
    certificatesDescription: localized("certificatesDescription"),
    clientsTitle: localized("clientsTitle"),
    clientsQuote: localized("clientsQuote"),
    stats: {
      years: { value: raw.stat_years_value, suffix: raw.stat_years_suffix },
      projects: { value: raw.stat_projects_value, suffix: raw.stat_projects_suffix },
      employees: { value: raw.stat_employees_value, suffix: raw.stat_employees_suffix },
      tonnage: { value: raw.stat_tonnage_value, suffix: raw.stat_tonnage_suffix },
    },
  };
}

/**
 * Reads every `name="heroTitle_ru"`-style field the form submits and turns
 * it into the flat `hero_title_ru`-style JSON body the backend's
 * `AboutContentUpdate` expects — the mirror image of `toDto`'s `localized()`.
 */
function toUpdatePayload(formData: FormData): Record<string, string | number> {
  const payload: Record<string, string | number> = {};

  for (const field of Object.keys(FIELD_TO_COLUMN) as LocalizedField[]) {
    const column = FIELD_TO_COLUMN[field];
    for (const locale of LOCALES) {
      const value = formData.get(`${field}_${locale}`);
      if (typeof value === "string") payload[`${column}_${locale}`] = value;
    }
  }

  for (const stat of ["years", "projects", "employees", "tonnage"] as const) {
    const value = formData.get(`stat_${stat}_value`);
    const suffix = formData.get(`stat_${stat}_suffix`);
    if (typeof value === "string" && value !== "") payload[`stat_${stat}_value`] = Number(value);
    if (typeof suffix === "string") payload[`stat_${stat}_suffix`] = suffix;
  }

  return payload;
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

  return { success: true, data: (await res.json()) as T };
}

function revalidateAboutContent() {
  revalidatePath("/admin/about");
  // "max": stale-while-revalidate — the recommended profile per Next 16's
  // revalidateTag docs. The two-argument form is required now; omitting the
  // profile is deprecated.
  revalidateTag("about-content", "max");
}

export async function getAdminAboutContent(): Promise<AdminAboutContentDto | null> {
  const result = await adminRequest<RawAboutContent>("/api/about-content", {
    cache: "no-store",
  });
  return result.success ? toDto(result.data) : null;
}

export async function updateAboutContentAction(formData: FormData): Promise<ActionResult> {
  const result = await adminRequest("/api/about-content", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toUpdatePayload(formData)),
  });
  if (result.success) revalidateAboutContent();
  return result;
}
