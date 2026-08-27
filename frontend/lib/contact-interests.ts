import { hasLocale } from "next-intl";

import { BACKEND_API_URL } from "@/lib/admin-auth";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";

/**
 * Server-only read path for `ContactsLeadSection`'s "Что вас интересует?"
 * checkboxes — same shape as `lib/about.ts`'s `getAboutTimeline`. Managed
 * from the admin panel (`app/admin/(dashboard)/contacts/page.tsx`); used to
 * be the catalog's own categories (`data/products.ts`), now its own
 * reorderable list so an admin can add/rename/reorder/remove options without
 * touching the product catalogue.
 */

function resolveLocale(locale: string): Locale {
  return hasLocale(routing.locales, locale) ? locale : defaultLocale;
}

interface RawContactInterest {
  id: number;
  label_ru: string;
  label_tj: string;
  label_en: string;
  label_tr: string;
  position: number;
}

export interface ContactInterestDto {
  id: number;
  label: string;
}

export async function getContactInterests(locale: string): Promise<ContactInterestDto[]> {
  const resolved = resolveLocale(locale);
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/contact-interests`, {
      next: { revalidate: 60, tags: ["contact-interests"] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];

    const data: RawContactInterest[] = await res.json();
    return data
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((raw) => ({ id: raw.id, label: raw[`label_${resolved}`] }));
  } catch {
    return [];
  }
}
