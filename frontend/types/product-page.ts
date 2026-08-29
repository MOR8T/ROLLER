import type { LocalizedPair, LocalizedText } from "@/lib/localized";

/**
 * The view model of `/[locale]/products/[category]/[product]`.
 *
 * Not a domain type — `types/index.ts` keeps those. This file describes the
 * *page*: one object, assembled once in `lib/products.ts` from the API, held in
 * state by `ProductPageView` and handed down section by section. A section
 * receives its slice and nothing else, so no section knows about the backend,
 * the message catalogue or the route params.
 *
 * Three rules keep the sections uniform:
 *
 *  1. Every section extends `ProductSection` — the same `id`, `title`,
 *     `description`, `media` and `actions` in the same places, so the layouts
 *     differ and the plumbing does not.
 *  2. Every string is a `LocalizedText`. The section picks its locale with
 *     `localized(text, locale)`; nothing calls `useTranslations`.
 *  3. The body of the page is an *ordered array*, not a fixed set of named
 *     slots. Which blocks a product has, in which order, and how many of each,
 *     is the admin's decision — see `ProductPageBlock` below.
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

/**
 * One block in the body of a product page, tagged with which of the five kinds
 * it is.
 *
 * ⚠️ This was a fixed object — `{ hero, finishes, specs, story, gallery, promo,
 * contacts }` — until the page moved to the backend. It is a discriminated
 * union in an array now because the admin panel builds the page: they choose
 * which blocks a product has, they order them, and nothing stops them from
 * adding two galleries. A named slot per kind cannot express any of that.
 *
 * `hero`, `promo` and `contacts` are deliberately *not* in here. The hero is
 * the product's own photo, title and description — the fields the admin fills
 * in before there are any sections at all; the promo block is the site's one
 * calculator pitch, identical on every product and no longer admin content
 * (see `ProductPageData.promo` below); the contacts block is the site's one
 * lead form, which closes every product page. None of the three is a block
 * the admin adds, removes or moves, so none is a `ProductPageBlock`.
 */
export type ProductPageBlock =
  | { kind: "finishes"; section: ProductFinishesSectionData }
  | { kind: "specs"; section: ProductSpecsSectionData }
  | { kind: "story"; section: ProductStorySectionData }
  | { kind: "gallery"; section: ProductGallerySectionData };

/**
 * The whole page in one value.
 *
 * `not-found` is a state of this page rather than `notFound()`: the category
 * segment is not validated against the product, so `/products/9/3` renders the
 * product whatever category 9 turns out to be, and only an unknown *product*
 * lands here — the client asked for a section that says so instead of the
 * site's 404.
 */
export type ProductPageData =
  | {
      status: "found";
      categoryId: number;
      productId: number;
      hero: ProductHeroSectionData;
      blocks: ProductPageBlock[];
      promo: ProductPromoSectionData;
      contacts: ProductContactsSectionData;
    }
  | {
      status: "not-found";
      categoryId: number;
      productId: number;
      notFound: ProductNotFoundSectionData;
    };
