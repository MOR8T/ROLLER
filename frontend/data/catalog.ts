import type { Application, Category, Material, Product, Segment } from "@/types";

/**
 * The catalog: two categories, six applications, six profile systems.
 *
 * Structure — `project_plan/04-catalog-and-applications.md`, two axes:
 *
 *   **Category** = the material (`pvc`, `aluminium`). Exactly two, and a
 *   product belongs to exactly one. This is the product's home and its URL.
 *
 *   **Application** = a facet *and* an SEO landing. Many-to-many with products,
 *   because ROLLER goes into windows and doors alike; filing it under "PVC
 *   windows" would be a lie about the domain, while the brief's search terms
 *   ("пластиковые окна Душанбе", "алюминиевые двери Душанбе") still have to be
 *   answered by *some* page. That page is `/solutions/[application]`.
 *
 * Same split as `data/home.ts` and for the same reason: this file holds only
 * what is identical in all four locales — slugs, image paths, numbers, the
 * product↔application links. Every word lives in `messages/{ru,tg,en,tr}.json`
 * and is looked up by slug. On the backend the text half becomes JSONB
 * (`project_plan/10-database-schema.md`), so components already consume the two
 * halves the way they will once the API exists.
 *
 * Each `…Base` type is the domain interface from `@/types` minus the fields the
 * message catalogue supplies, so the contract stays visible in one place.
 */

/** Copy: `categories.items.<slug>`. */
export type CategoryBase = Omit<Category, "title" | "description"> & {
  /** The dot on the category card — brand red for PVC, black for aluminium. */
  accent: string;
};

export const categories: CategoryBase[] = [
  {
    slug: "pvc",
    image: "/products/stella/stella-main.png",
    accent: "bg-brand-red",
  },
  {
    slug: "aluminium",
    image: "/products/thermo/thermo-anthracite.png",
    accent: "bg-brand-black",
  },
];

/**
 * Copy: `applications.items.<slug>`.
 *
 * The list is the plan's, in the plan's order. It replaced an earlier set of
 * *situations* (`apartment`, `house`, `commercial`, `facade`) that the homepage
 * shipped in stage 02: a situation cannot be a facet on a product — every
 * system suits every situation — so it could never satisfy the many-to-many
 * link this axis exists for. DESIGN.md §7 asks that the visitor's first choice
 * not be a material, and "windows or a facade?" answers that just as well.
 *
 * `image` is `null` throughout: context-layer photography (interiors, facades,
 * finished objects) does not exist yet, and DESIGN.md §6 п.2 requires those
 * slots to be data fields the client fills through the admin panel rather than
 * hardcoded paths.
 */
export type ApplicationBase = Omit<Application, "title" | "description">;

export const applications: ApplicationBase[] = [
  { slug: "windows", image: null },
  { slug: "doors", image: null },
  { slug: "sliding-systems", image: null },
  { slug: "facade-glazing", image: null },
  { slug: "mosquito-nets", image: null },
  { slug: "partitions", image: null },
];

/**
 * Copy: `brands.items.<slug>` (name, one-line audience) and
 * `products.items.<slug>` (description, spec pairs).
 *
 * Ordered as a ladder from economy to premium within each material — that order
 * *is* the explanation of why there are four PVC brands (DESIGN.md §7), and the
 * catalog grid, the category pages and the homepage lineup all read it here.
 *
 * `specs` is not on this type. The pairs are text on both sides — "Глубина
 * профиля" / "60 мм" — so there is no locale-independent half to keep, and
 * holding them in the catalogue is also what makes the schema flexible in the
 * way `Spec` describes: a product declares whichever pairs it has, and nothing
 * in the layout assumes a fixed set.
 */
export type ProductBase = Omit<Product, "name" | "shortDescription" | "description" | "specs">;

export const products: ProductBase[] = [
  {
    slug: "ecoline",
    kind: "system",
    categorySlug: "pvc",
    segment: "economy",
    applicationSlugs: ["windows", "doors"],
    depthMm: 60,
    chambers: 3,
    // Warranty covers the white profile only — ЭКОЛАЙН ships in no other
    // colour (brief §7.5), which is exactly the case a shared palette would
    // have got wrong.
    colors: ["white"],
    images: [],
    logo: "/logos/ecolayn.png",
    popular: false,
  },
  {
    slug: "roller",
    kind: "system",
    categorySlug: "pvc",
    segment: "mid",
    applicationSlugs: ["windows", "doors"],
    depthMm: 60,
    chambers: 4,
    colors: ["white", "golden-oak", "dark-oak", "mahogany", "nut", "grey"],
    images: ["/products/roller/roller-main.png"],
    logo: "/logos/logo-dark.png",
    popular: true,
  },
  {
    slug: "unopen",
    kind: "system",
    categorySlug: "pvc",
    segment: "upper-mid",
    applicationSlugs: ["windows", "doors", "sliding-systems"],
    depthMm: 65,
    chambers: 5,
    colors: ["white", "golden-oak", "dark-oak", "mahogany", "nut", "grey"],
    images: ["/products/unopen/unopen-main.png"],
    logo: "/logos/unopen.png",
    popular: false,
  },
  {
    slug: "stella",
    kind: "system",
    categorySlug: "pvc",
    segment: "premium",
    applicationSlugs: ["windows", "doors"],
    depthMm: 75,
    chambers: 5,
    colors: ["white", "golden-oak", "dark-oak", "mahogany", "nut", "grey"],
    images: ["/products/stella/stella-main.png"],
    logo: "/logos/stella-red.png",
    popular: true,
  },
  {
    slug: "ald-45",
    kind: "system",
    categorySlug: "aluminium",
    materialNote: "cold",
    segment: "economy",
    applicationSlugs: ["doors", "sliding-systems", "partitions", "facade-glazing"],
    depthMm: 45,
    chambers: 1,
    colors: ["anthracite", "white", "golden-oak", "brown"],
    images: ["/products/holodniy/holodniy-white.png"],
    // No mark of their own: the two aluminium systems have no logo, so every
    // card that renders a product must lay out identically without one.
    logo: null,
    popular: false,
  },
  {
    slug: "thermo-60",
    kind: "system",
    categorySlug: "aluminium",
    materialNote: "warm",
    segment: "premium",
    applicationSlugs: ["windows", "doors", "sliding-systems", "facade-glazing"],
    depthMm: 60,
    chambers: 3,
    colors: ["anthracite", "white", "golden-oak", "brown"],
    images: ["/products/thermo/thermo-anthracite.png"],
    logo: null,
    popular: true,
  },
];

/**
 * Segments in ladder order, for the catalog filter.
 *
 * ⚠️ The plan's data-model sketch names these `economy | standard | upper |
 * premium`. The code has said `economy | mid | upper-mid | premium` since stage
 * 01 and all four message catalogues are keyed on it, so the code wins — the
 * same call the plan itself makes for `pvc` over `pvh`.
 */
export const segments: Segment[] = ["economy", "mid", "upper-mid", "premium"];

export const categorySlugs = categories.map((category) => category.slug);
export const applicationSlugs = applications.map((application) => application.slug);

export function isCategorySlug(value: string): value is Material {
  return categorySlugs.some((slug) => slug === value);
}

export function isApplicationSlug(value: string): boolean {
  return applicationSlugs.includes(value);
}

/** Catalog → category → product. The one place the product URL is built. */
export function productHref(product: ProductBase): string {
  return `/catalog/${product.categorySlug}/${product.slug}`;
}

export function categoryHref(slug: Material): string {
  return `/catalog/${slug}`;
}

export function applicationHref(slug: string): string {
  return `/solutions/${slug}`;
}

export function productsByCategory(slug: Material): ProductBase[] {
  return products.filter((product) => product.categorySlug === slug);
}

export function productsByApplication(slug: string): ProductBase[] {
  return products.filter((product) => product.applicationSlugs.includes(slug));
}

/** The applications a product is listed under, in the canonical list order. */
export function applicationsOfProduct(product: ProductBase): ApplicationBase[] {
  return applications.filter((application) => product.applicationSlugs.includes(application.slug));
}

/** Systems shown as "other systems" — same category, excluding the current one. */
export function relatedProducts(product: ProductBase): ProductBase[] {
  return productsByCategory(product.categorySlug).filter(
    (candidate) => candidate.slug !== product.slug,
  );
}
