import { hasLocale } from "next-intl";

import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { BACKEND_API_URL } from "@/lib/admin-auth";

/**
 * The showroom section's data access layer — the same shape as
 * `lib/news.ts`/`lib/partners.ts`. Showrooms are managed from the admin panel
 * (`app/admin/(dashboard)/showrooms/page.tsx`, `showrooms-actions.ts`) and
 * stored in the backend with a city, address and working hours per locale
 * (`city_ru`/`city_tj`/…, see `RawShowroom`); this module picks out the one
 * `locale` a page needs and resolves everything else (phone, coordinates,
 * the route link, the photo) into the flat shape `ShowroomMap`,
 * `ShowroomsSection` and `ShowroomsDirectory` render.
 *
 * `id` is stringified: the map/city-picker components pass ids through
 * `useState<string>` and `CitySelect`'s `{ id: string }` option shape, which
 * predates the backend and is shared with nothing that needs a number.
 */
export interface ShowroomDto {
  id: string;
  city: string;
  address: string;
  hours: string;
  phone: string;
  phoneHref: string;
  /** `[lng, lat]` — see the note on `coordinates` below. */
  coordinates: [number, number];
  routeUrl: string;
  photo: string;
}

interface RawShowroom {
  id: number;
  city_ru: string;
  city_tj: string;
  city_en: string;
  city_tr: string;
  address_ru: string;
  address_tj: string;
  address_en: string;
  address_tr: string;
  hours_ru: string;
  hours_tj: string;
  hours_en: string;
  hours_tr: string;
  phone: string;
  lat: number;
  lng: number;
  route_url: string;
  photo_path: string;
  position: number;
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
function resolvePhotoSrc(photoPath: string): string {
  return photoPath;
}

/** `+992 700 600 700` → `tel:+992700600700` — whitespace is the only thing a
 * `tel:` link cannot carry; everything else the admin types through as-is. */
function toPhoneHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function toShowroom(raw: RawShowroom, locale: Locale): ShowroomDto {
  const city: Record<Locale, string> = {
    ru: raw.city_ru,
    tj: raw.city_tj,
    en: raw.city_en,
    tr: raw.city_tr,
  };
  const address: Record<Locale, string> = {
    ru: raw.address_ru,
    tj: raw.address_tj,
    en: raw.address_en,
    tr: raw.address_tr,
  };
  const hours: Record<Locale, string> = {
    ru: raw.hours_ru,
    tj: raw.hours_tj,
    en: raw.hours_en,
    tr: raw.hours_tr,
  };

  return {
    id: String(raw.id),
    city: city[locale] ?? city[defaultLocale],
    address: address[locale] ?? address[defaultLocale],
    hours: hours[locale] ?? hours[defaultLocale],
    phone: raw.phone,
    phoneHref: toPhoneHref(raw.phone),
    coordinates: [raw.lng, raw.lat],
    routeUrl: raw.route_url,
    photo: resolvePhotoSrc(raw.photo_path),
  };
}

/**
 * The full, all-locale list, position order. Returns `[]` — never throws,
 * never a fabricated placeholder — if the backend is unreachable or has no
 * showrooms yet; callers render nothing or a skeleton in that case.
 */
async function loadRaw(): Promise<RawShowroom[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/showrooms`, {
      next: { revalidate: 60, tags: ["showrooms"] },
    });
    if (!res.ok) return [];

    const data: RawShowroom[] = await res.json();
    return data.slice().sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

/**
 * `locale` is the raw route segment, because that is what a page has —
 * `PageProps` types it as `string`, and only the layout narrows it. The same
 * `hasLocale` guard the layout uses narrows it here, and anything else falls
 * back to the default locale rather than throwing: a bad segment is already
 * a 404 by then.
 */
export async function getShowrooms(locale: string): Promise<ShowroomDto[]> {
  const key: Locale = hasLocale(routing.locales, locale) ? locale : defaultLocale;
  const raw = await loadRaw();
  return raw.map((item) => toShowroom(item, key));
}
