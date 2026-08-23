import type { LocalizedPair, LocalizedText } from "@/lib/localized";

/**
 * The view model of `/[locale]/products/[category]/[product]`.
 *
 * Not a domain type — `types/index.ts` keeps those, and they are the contract
 * the API will satisfy. This file describes the *page*: one object, assembled
 * once in `page.tsx`, held in state by `ProductPageView` and handed down section
 * by section. A section receives its slice and nothing else, so no section
 * reads `data/products.ts`, the message catalogue or the route params.
 *
 * Two rules keep the sections uniform:
 *
 *  1. Every section extends `ProductSection` — the same `id`, `title`,
 *     `description`, `media` and `actions` in the same places, so the layouts
 *     differ and the plumbing does not.
 *  2. Every string is a `LocalizedText`. The section picks its locale with
 *     `localized(text, locale)`; nothing calls `useTranslations`.
 */

export interface ProductMedia {
  src: string;
  alt: LocalizedText;
}

/**
 * Which of the reference's buttons this action becomes: black filled, black
 * outlined, or white filled — the last one for a photograph or a black ground.
 */
export type ProductActionTone = "primary" | "outline" | "light";

export interface ProductAction {
  label: LocalizedText;
  href: string;
  tone: ProductActionTone;
}

/**
 * The fields every section on the page shares.
 *
 * ⚠️ No `eyebrow`. The small uppercase label above a heading is a ROLLER
 * pattern and the reference has none anywhere on the page, so the field went
 * with the restyle rather than being kept and left unread.
 */
export interface ProductSection {
  /** DOM id and anchor target. Unique across the page. */
  id: string;
  title?: LocalizedText;
  description?: LocalizedText;
  media?: ProductMedia[];
  actions?: ProductAction[];
}

/** One lamination: swatch fill, name, and the render wearing it. */
export interface ProductFinish {
  color: string;
  swatch: string;
  label: LocalizedText;
  image: ProductMedia | null;
}

/**
 * The hero carries nothing but the name, the paragraph and the buttons — the
 * reference's opening screen has no badge and no numbers, and the depth,
 * chambers and colour count all appear in the spec table further down.
 */
export type ProductHeroSectionData = ProductSection;

export interface ProductFinishesSectionData extends ProductSection {
  finishes: ProductFinish[];
  /** Explains a single-colour palette — ЭКОЛАЙН ships in white and no other. */
  note?: LocalizedText;
  /** Stands in where a system has no renders at all. */
  placeholder: LocalizedText;
}

export interface ProductSpecsSectionData extends ProductSection {
  specs: LocalizedPair[];
}

export interface ProductStorySectionData extends ProductSection {
  paragraphs: LocalizedText[];
}

export interface ProductGallerySectionData extends ProductSection {
  /** Labels for the two arrow buttons — the slider has no other chrome. */
  controls: {
    previous: LocalizedText;
    next: LocalizedText;
  };
}

export type ProductPromoSectionData = ProductSection;

export interface ProductContactsSectionData extends ProductSection {
  /** Reaches the lead as «Система: ROLLER», so the call centre sees the page. */
  context: LocalizedText;
}

export type ProductNotFoundSectionData = ProductSection;

export interface ProductPageSections {
  hero: ProductHeroSectionData;
  finishes: ProductFinishesSectionData;
  specs: ProductSpecsSectionData;
  story: ProductStorySectionData;
  gallery: ProductGallerySectionData;
  promo: ProductPromoSectionData;
  contacts: ProductContactsSectionData;
}

/**
 * The whole page in one value.
 *
 * `not-found` is a state of this page rather than `notFound()`: the category
 * segment is not validated against the product, so `/products/anything/roller`
 * and `/products/windows/nothing` both land here, and the client asked for a
 * section that says so instead of the site's 404.
 */
export type ProductPageData =
  | {
      status: "found";
      category: string;
      product: string;
      sections: ProductPageSections;
    }
  | {
      status: "not-found";
      category: string;
      product: string;
      notFound: ProductNotFoundSectionData;
    };
