import { hasLocale } from "next-intl";

import { BACKEND_API_URL } from "@/lib/admin-auth";
import { defaultLocale, routing, type Locale } from "@/i18n/routing";

/**
 * Server-only read path for `ContactsLeadSection`'s contact list (rendered
 * on `/contacts` and six other pages) — same shape as `lib/about.ts`: a
 * tagged `fetch` against the backend, mapped to a locale-resolved DTO, with
 * `null` on any failure rather than a fabricated fallback. Managed from the
 * admin panel (`app/admin/(dashboard)/contacts/page.tsx`).
 */

function resolveLocale(locale: string): Locale {
  return hasLocale(routing.locales, locale) ? locale : defaultLocale;
}

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

export interface ContactInfoDto {
  address: string;
  mapUrl: string;
  phone: string;
  phoneHref: string;
  email: string;
  emailHref: string;
  whatsapp: string;
  whatsappHref: string;
  social: {
    instagram: { url: string; enabled: boolean };
    telegram: { url: string; enabled: boolean };
  };
}

function toDto(raw: RawContactInfo, locale: Locale): ContactInfoDto {
  return {
    address: raw[`address_${locale}`],
    mapUrl: raw.map_url,
    phone: raw.phone,
    phoneHref: `tel:${raw.phone.replace(/[^\d+]/g, "")}`,
    email: raw.email,
    emailHref: `mailto:${raw.email}`,
    whatsapp: raw.whatsapp,
    whatsappHref: `https://wa.me/${raw.whatsapp}`,
    social: {
      instagram: { url: raw.social_instagram_url, enabled: raw.social_instagram_enabled },
      telegram: { url: raw.social_telegram_url, enabled: raw.social_telegram_enabled },
    },
  };
}

/**
 * Returns `null` — never a fabricated placeholder — if the backend is
 * unreachable, too slow, or has nothing seeded yet. `ContactsLeadSection`
 * renders a skeleton in that case instead of guessing at copy.
 *
 * `signal: AbortSignal.timeout(...)` matters more here than on the other
 * `lib/*.ts` readers: `Footer` (global layout chrome, every page) calls this
 * too, so a hung backend must fail fast rather than stall every page load —
 * without it, a slow/unreachable backend blocks rendering for however long
 * the platform's own socket timeout is (minutes, not seconds).
 */
export async function getContactInfo(locale: string): Promise<ContactInfoDto | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/contact-info`, {
      next: { revalidate: 60, tags: ["contact-info"] },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    return toDto((await res.json()) as RawContactInfo, resolveLocale(locale));
  } catch {
    return null;
  }
}
