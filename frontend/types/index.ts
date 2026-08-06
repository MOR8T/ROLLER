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

/**
 * A catalog category is the **material**, and nothing else — there are exactly
 * two of them and they are a product's "home" and its URL
 * (`project_plan/04-catalog-and-applications.md`).
 *
 * The slug is `Material`, not `string`: the plan warns that an older draft
 * wrote `pvh` where the code writes `pvc`, and typing the slug is what stops
 * that ever being expressible again.
 */
export interface Category {
  slug: Material;
  title: string;
  description: string;
  image: string;
}

/**
 * One characteristic of a product, as a free-form pair.
 *
 * Deliberately *not* a fixed set of columns. A mosquito net, a windowsill or a
 * handle has neither chambers nor a glazing unit, so a `ProductSpecs` interface
 * with `chambers: number` would either lie about them or need a migration the
 * day the client adds one through the admin panel. The two filters the brief
 * actually asks for — category and segment — are typed fields on `Product`, so
 * typed spec columns would buy nothing.
 *
 * ⚠️ Not enough for the configurator (stage 06), which needs machine-readable
 * option lists. That is open question №1 in `project_plan/00-overview.md`.
 */
export interface Spec {
  name: string;
  value: string;
}

/**
 * `component` covers nets, windowsills, cable trunking, cylinders and the rest.
 * None of them are in the catalog at launch — there is no content for them —
 * but the schema accepts them, which is the point of the flexible `specs`.
 */
export type ProductKind = "system" | "component";

/**
 * A product is a **profile system**. It lives in exactly one category (its
 * material) and is linked many-to-many to applications, because one system —
 * ROLLER, say — goes into both windows and doors and cannot honestly be filed
 * under "PVC windows".
 */
export interface Product {
  slug: string;
  /** Brand name. Translated: `ТЕРМО 60` on RU/TG, `THERMO 60` on EN/TR. */
  name: string;
  kind: ProductKind;
  categorySlug: Material;
  /** Only meaningful for the aluminium systems: with or without a thermal break. */
  materialNote?: MaterialNote;
  applicationSlugs: string[];
  segment: Segment;
  /** Structural depth in millimetres. The unit is a word, so it is joined per locale. */
  depthMm: number;
  chambers: number;
  shortDescription: string;
  description: string;
  specs: Spec[];
  colors: string[];
  images: string[];
  /** `null` for the aluminium brands, which have no mark of their own. */
  logo: string | null;
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
 * The second axis of the catalog: a facet on `Product` *and* an SEO landing of
 * its own (`project_plan/04-catalog-and-applications.md`).
 *
 * It exists because the category axis cannot carry the brief's search terms.
 * "Пластиковые окна Душанбе" and "алюминиевые двери Душанбе" (brief §14.2) are
 * queries about what the thing *does*, and every one of the six systems does
 * several of those things — so the query gets a landing page, not a category.
 *
 * It is also the entry point a flat owner can actually use. "PVC or
 * aluminium?" is a manufacturer's question (DESIGN.md §7); "windows or a
 * facade?" is not.
 */
export interface Application {
  slug: string;
  title: string;
  description: string;
  image: string | null;
}

/** A "Профессионалам" offering — wholesale, dealership, components, docs. */
export interface ProOffering {
  key: string;
  title: string;
  description: string;
}

export type ProductCardBadgeVariant = "red" | "black" | "outline";

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
