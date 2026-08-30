import { BACKEND_API_URL } from "@/lib/admin-auth";
import { defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Server-only read path for the homepage hero carousel. Slides are managed
 * from the admin panel (`app/admin/(dashboard)/page.tsx`) and stored in the
 * backend with a title per locale (`title_ru`/`title_tj`/`title_en`/`title_tr`
 * — see `RawHeroSlide`); this module picks out the one `locale` needs.
 * `imageSrc` is always a ready-to-use `<Image src>`: either an absolute URL
 * into the backend's `/uploads`, or a local `public/` path.
 *
 * An empty array means "no slides yet" — there is no static fallback deck
 * anymore. `hero-section.tsx` renders a skeleton in that case instead of
 * fabricated content.
 */
export interface HeroSlideDto {
  id: number;
  title: string;
  imageSrc: string;
  productLink: string;
}

interface RawHeroSlide {
  id: number;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  image_path: string;
  product_link: string;
  position: number;
}

function titleForLocale(raw: RawHeroSlide, locale: string): string {
  const byLocale: Record<Locale, string> = {
    ru: raw.title_ru,
    tj: raw.title_tj,
    en: raw.title_en,
    tr: raw.title_tr,
  };
  return byLocale[locale as Locale] ?? byLocale[defaultLocale];
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
function resolveImageSrc(imagePath: string): string {
  return imagePath;
}

/**
 * Reads the live slides from the backend. Returns an empty array — never a
 * fabricated placeholder — if the backend is unreachable or has no slides
 * yet; the caller is responsible for showing a loading/empty state.
 */
export async function getHeroSlides(locale: string): Promise<HeroSlideDto[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/hero-slides`, {
      next: { revalidate: 60, tags: ["hero-slides"] },
    });
    if (!res.ok) return [];

    const data: RawHeroSlide[] = await res.json();
    return data
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((raw) => ({
        id: raw.id,
        title: titleForLocale(raw, locale),
        imageSrc: resolveImageSrc(raw.image_path),
        productLink: raw.product_link,
      }));
  } catch {
    return [];
  }
}
