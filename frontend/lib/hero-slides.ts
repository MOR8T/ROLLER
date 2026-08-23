import { getTranslations } from "next-intl/server";
import { heroSlides as staticHeroSlides } from "@/data/home";
import { BACKEND_API_URL } from "@/lib/admin-auth";
import { defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Server-only read path for the homepage hero carousel. Slides are managed
 * from the admin panel (`app/admin/(dashboard)/page.tsx`) and stored in the
 * backend with a title per locale (`title_ru`/`title_tj`/`title_en`/`title_tr`
 * — see `RawHeroSlide`); this module picks out the one `locale` needs.
 * `imageSrc` is always a ready-to-use `<Image src>`: either an absolute URL
 * into the backend's `/uploads`, or a local `public/` path.
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

/** Only `BACKEND_API_URL` needs the Docker-internal hostname; the browser
 * loads images through this one instead. Same value everywhere except a
 * Docker Compose deployment, where they diverge — see `.env.example`. */
const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL ?? BACKEND_API_URL;

function resolveImageSrc(imagePath: string): string {
  return imagePath.startsWith("/uploads/") ? `${BACKEND_PUBLIC_URL}${imagePath}` : imagePath;
}

/**
 * Reads the live slides from the backend. Falls back to the four static
 * banners in `data/home.ts` — translated into `locale` — whenever the
 * backend is unreachable or has no slides yet, so the homepage never ships
 * an empty deck while content is still being set up in the admin panel.
 */
export async function getHeroSlides(locale: string): Promise<HeroSlideDto[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/hero-slides`, {
      next: { revalidate: 60, tags: ["hero-slides"] },
    });

    if (res.ok) {
      const data: RawHeroSlide[] = await res.json();
      if (data.length > 0) {
        return data
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((raw) => ({
            id: raw.id,
            title: titleForLocale(raw, locale),
            imageSrc: resolveImageSrc(raw.image_path),
            productLink: raw.product_link,
          }));
      }
    }
  } catch {
    // Backend unreachable — fall through to the static fixture below.
  }

  const t = await getTranslations({ locale, namespace: "hero" });
  return staticHeroSlides.map((slide, index) => ({
    id: -(index + 1),
    title: t(`slides.${slide.key}.headline`),
    imageSrc: slide.image,
    productLink: slide.cta,
  }));
}
