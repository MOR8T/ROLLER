/**
 * Domain types — the contract the FastAPI backend will have to satisfy
 * (`project_plan/10-database-schema.md`).
 *
 * Every discriminator below is a **locale-independent key**, never a display
 * label. They used to be Russian string literals (`"ПВХ"`, `"выше среднего"`),
 * which worked while the site was monolingual and stops working the moment a
 * value has to be both a stable enum in Postgres and a translated word on
 * screen. The labels now live in `messages/*.json` under `materials.*`,
 * `segments.*` and `materialNotes.*`.
 *
 * Text-bearing fields (`title`, `description`, `audience`, …) stay on these
 * interfaces: the backend stores them as JSONB and resolves them per request,
 * so the API will return exactly this shape. During the frontend-only phase
 * `data/` supplies the non-text half and the message catalogue supplies the
 * text — see `data/home.ts`.
 */

export type Material = "pvc" | "aluminium";

/** Only meaningful for the aluminium systems: with or without a thermal break. */
export type MaterialNote = "cold" | "warm";

export type Segment = "economy" | "mid" | "upper-mid" | "premium";

export type ProjectCategory = "residential" | "commercial" | "private";

export interface Category {
  slug: string;
  title: string;
  description: string;
  image: string;
}

export interface ProductSpecs {
  thickness: string;
  chambers: number;
  glazing: string;
  soundInsulation: boolean;
  heatInsulation: boolean;
  warranty: string;
}

export interface Product {
  slug: string;
  name: string;
  brand: string;
  categorySlug: string;
  segment: Segment;
  material: Material;
  shortDescription: string;
  specs: ProductSpecs;
  colors: string[];
  images: string[];
  popular: boolean;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  publishedAt: string;
}

export interface Project {
  slug: string;
  title: string;
  city: string;
  description: string;
  images: string[];
}

export interface Lead {
  name: string;
  phone: string;
  city: string;
  productType: string;
  comment?: string;
}

export interface Cta {
  label: string;
  href: string;
}

/**
 * The homepage first screen. One promise, one primary action, one secondary
 * action — DESIGN.md §7 describes the hero in the singular, and §2 explicitly
 * rules out the IMZO-style promo carousel.
 */
export interface HeroContent {
  eyebrow: string;
  headline: string;
  subtext: string;
  /**
   * "Context" layer image — an interior, facade or finished object (DESIGN.md
   * §6). Never a profile cutaway: that is the single thing §11 forbids on the
   * first screen. `null` until real photography exists.
   */
  image: string | null;
  imageLabel: string;
  primaryCta: Cta;
  secondaryCta: Cta;
}

/**
 * One of the six profile systems, the core of the homepage (DESIGN.md §7).
 * The site's stated job is explaining why there are four PVC brands and how
 * ROLLER differs from UNOPEN, and this is where that happens.
 */
export interface Brand {
  slug: string;
  /**
   * Translated: the Cyrillic brands are written `ЭКОЛАЙН` / `АЛД-45` /
   * `ТЕРМО 60` on the Russian and Tajik sites and `ECOLINE` / `ALD-45` /
   * `THERMO 60` on the English and Turkish ones. The Latin brands
   * (ROLLER, UNOPEN, STELLA) read the same in all four.
   */
  name: string;
  material: Material;
  materialNote?: MaterialNote;
  segment: Segment;
  /** Structural depth as shown, unit included — "60 мм" / "60 mm". */
  depth: string;
  chambers: number;
  /** The single "для кого" line that makes the card readable by a non-expert. */
  audience: string;
  /**
   * `null` for the aluminium systems, which have no mark of their own — the
   * card then falls back to typography. Both cases must lay out identically.
   */
  logo: string | null;
  image: string | null;
  href: string;
}

/**
 * An entry point by situation rather than by material. A flat owner cannot
 * answer "PVC or aluminium?" — that is a manufacturer's question (DESIGN.md §7).
 */
export interface Application {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  href: string;
}

/** A "Профессионалам" offering — wholesale, dealership, components, docs. */
export interface ProOffering {
  key: string;
  title: string;
  description: string;
}

export type ProductCardBadgeVariant = "red" | "black" | "outline";

export interface ShowcaseProduct {
  slug: string;
  name: string;
  type: string;
  badge: string;
  badgeVariant: ProductCardBadgeVariant;
  description: string;
  summary: string;
  highlights: string[];
  image: string;
  href: string;
  priority?: boolean;
}

export interface ProjectTeaser {
  id: string;
  title: string;
  location: string;
  category: ProjectCategory;
  image: string;
  caption: string;
  href: string;
}

export interface NewsTeaser {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  /** ISO-8601 date; rendered through `next-intl`'s formatter per locale. */
  date: string;
  href: string;
}

export interface Partner {
  name: string;
  logo: string | null;
}
