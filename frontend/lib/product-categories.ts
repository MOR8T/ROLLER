import { hasLocale } from "next-intl";

import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { BACKEND_API_URL } from "@/lib/admin-auth";

/**
 * Server-only read path for `ProductsGridSection` — same shape as
 * `lib/partners.ts`/`lib/showrooms.ts`. Product categories are managed from
 * the admin panel (`app/admin/(dashboard)/product-categories/page.tsx`) and
 * stored in the backend as a name per locale plus a photo and a position.
 *
 * There is no slug: a card links to `/products/<id>`, the category page, which
 * is also where the product URLs get their first segment. `lib/products.ts` is
 * the read path for that page and for the products themselves — this module
 * stays the categories-only one the homepage strip uses.
 */
export interface ProductCategoryDto {
  id: number;
  name: string;
  image: string;
}

interface RawProductCategory {
  id: number;
  name_ru: string;
  name_tj: string;
  name_en: string;
  name_tr: string;
  image_path: string;
  position: number;
}

/** Only `BACKEND_API_URL` needs the Docker-internal hostname; the browser
 * loads images through this one instead. Same value everywhere except a
 * Docker Compose deployment, where they diverge — see `.env.example`. */
const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL ?? BACKEND_API_URL;

function resolveImageSrc(imagePath: string): string {
  return imagePath.startsWith("/uploads/") ? `${BACKEND_PUBLIC_URL}${imagePath}` : imagePath;
}

function resolveLocale(locale: string): Locale {
  return hasLocale(routing.locales, locale) ? locale : defaultLocale;
}

function toProductCategory(raw: RawProductCategory, locale: Locale): ProductCategoryDto {
  const name: Record<Locale, string> = {
    ru: raw.name_ru,
    tj: raw.name_tj,
    en: raw.name_en,
    tr: raw.name_tr,
  };

  return {
    id: raw.id,
    name: name[locale] ?? name[defaultLocale],
    image: resolveImageSrc(raw.image_path),
  };
}

/**
 * Reads the live product categories from the backend, position order.
 * Returns an empty array — never a fabricated placeholder — if the backend
 * is unreachable or has no categories yet; the caller is responsible for
 * showing a loading/empty state.
 */
export async function getProductCategories(locale: string): Promise<ProductCategoryDto[]> {
  const key = resolveLocale(locale);

  try {
    const res = await fetch(`${BACKEND_API_URL}/api/product-categories`, {
      next: { revalidate: 60, tags: ["product-categories"] },
    });
    if (!res.ok) return [];

    const data: RawProductCategory[] = await res.json();
    return data
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((raw) => toProductCategory(raw, key));
  } catch {
    return [];
  }
}
