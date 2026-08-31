import { hasLocale } from "next-intl";

import { BACKEND_API_URL } from "@/lib/admin-auth";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";

/**
 * Server-only read path for `/about` (and, for `stats`, `/` too) — same
 * shape as `lib/partners.ts`/`lib/showrooms.ts`: a tagged `fetch` against the
 * backend, mapped to a locale-resolved DTO, with `null`/`[]` on any failure
 * rather than a fabricated fallback. `getAboutContent`/`getAboutTimeline`/
 * `getAboutCertificates` are managed from the admin panel
 * (`app/admin/(dashboard)/about/page.tsx`).
 *
 * `locale` is the raw route segment (`string`, same as `lib/showrooms.ts`'s
 * `getShowrooms`), because that is what a page has — `resolveLocale` falls
 * back to the default locale rather than throwing on a bad segment.
 */

function resolveLocale(locale: string): Locale {
  return hasLocale(routing.locales, locale) ? locale : defaultLocale;
}

/**
 * Admin uploads and seeded files are both served from this app's own origin,
 * so an API path needs nothing done to it — `/uploads/...` is answered by
 * nginx in production and by `next.config.ts`'s rewrite everywhere else, and
 * `next/image` optimises it like any local file. See that rewrite's comment
 * for why the absolute-URL version had to go.
 *
 * Kept as a function rather than inlined: this is the seam a CDN prefix would
 * be added at, and every DTO in this file already goes through it.
 */
function resolveImageSrc(path: string): string {
  return path;
}

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
  home_title_ru: string;
  home_title_tj: string;
  home_title_en: string;
  home_title_tr: string;
  home_description_ru: string;
  home_description_tj: string;
  home_description_en: string;
  home_description_tr: string;
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

export interface AboutStat {
  key: "years" | "projects" | "employees" | "tonnage";
  value: number;
  suffix: string;
}

export interface AboutContentDto {
  heroTitle: string;
  heroDescription: string;
  homeTitle: string;
  homeDescription: string;
  storyTitle: string;
  storyParagraphs: string[];
  timelineTitle: string;
  timelineDescription: string;
  certificatesTitle: string;
  certificatesDescription: string;
  clientsTitle: string;
  clientsQuote: string;
  stats: AboutStat[];
}

function toContentDto(raw: RawAboutContent, locale: Locale): AboutContentDto {
  return {
    heroTitle: raw[`hero_title_${locale}`],
    heroDescription: raw[`hero_description_${locale}`],
    homeTitle: raw[`home_title_${locale}`],
    homeDescription: raw[`home_description_${locale}`],
    storyTitle: raw[`story_title_${locale}`],
    storyParagraphs: raw[`story_paragraphs_${locale}`].split("\n\n").filter(Boolean),
    timelineTitle: raw[`timeline_title_${locale}`],
    timelineDescription: raw[`timeline_description_${locale}`],
    certificatesTitle: raw[`certificates_title_${locale}`],
    certificatesDescription: raw[`certificates_description_${locale}`],
    clientsTitle: raw[`clients_title_${locale}`],
    clientsQuote: raw[`clients_quote_${locale}`],
    stats: [
      { key: "years", value: raw.stat_years_value, suffix: raw.stat_years_suffix },
      { key: "projects", value: raw.stat_projects_value, suffix: raw.stat_projects_suffix },
      { key: "employees", value: raw.stat_employees_value, suffix: raw.stat_employees_suffix },
      { key: "tonnage", value: raw.stat_tonnage_value, suffix: raw.stat_tonnage_suffix },
    ],
  };
}

/**
 * Returns `null` — never a fabricated placeholder — if the backend is
 * unreachable. Callers on `/` and `/about` skip the sections they can't
 * render rather than guessing at copy.
 */
export async function getAboutContent(locale: string): Promise<AboutContentDto | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/about-content`, {
      next: { revalidate: 60, tags: ["about-content"] },
    });
    if (!res.ok) return null;

    return toContentDto((await res.json()) as RawAboutContent, resolveLocale(locale));
  } catch {
    return null;
  }
}

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

export interface AboutTimelineItemDto {
  id: number;
  year: string;
  title: string;
  description: string;
}

export async function getAboutTimeline(locale: string): Promise<AboutTimelineItemDto[]> {
  const resolved = resolveLocale(locale);
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/about-timeline`, {
      next: { revalidate: 60, tags: ["about-timeline"] },
    });
    if (!res.ok) return [];

    const data: RawAboutTimelineItem[] = await res.json();
    return data
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((raw) => ({
        id: raw.id,
        year: raw[`year_${resolved}`],
        title: raw[`title_${resolved}`],
        description: raw[`description_${resolved}`],
      }));
  } catch {
    return [];
  }
}

interface RawAboutCertificate {
  id: number;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  image_path: string;
  position: number;
}

export interface AboutCertificateDto {
  id: number;
  title: string;
  imageSrc: string;
}

export async function getAboutCertificates(locale: string): Promise<AboutCertificateDto[]> {
  const resolved = resolveLocale(locale);
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/about-certificates`, {
      next: { revalidate: 60, tags: ["about-certificates"] },
    });
    if (!res.ok) return [];

    const data: RawAboutCertificate[] = await res.json();
    return data
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((raw) => ({
        id: raw.id,
        title: raw[`title_${resolved}`],
        imageSrc: resolveImageSrc(raw.image_path),
      }));
  } catch {
    return [];
  }
}
