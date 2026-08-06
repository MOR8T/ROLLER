import type { Application, Category, Colorway, Material, Product, Segment } from "@/types";

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
    image: "/products/thermo-60/thermo-60-anthracite.png",
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

/**
 * Lamination palettes.
 *
 * The brief writes the PVC palette exactly once, under ROLLER, as a strip of
 * swatch images; STELLA and UNOPEN then say «КАК У РОЛЛЕРА» and ЭКОЛАЙН says
 * «ТОЛЬКО БЕЛЫЙ». So one shared constant is not a shortcut here — it *is* the
 * client's answer, and writing the seven colours out three times would invite
 * the three lists to drift apart.
 *
 * The keys were read off the renders themselves rather than off the swatch
 * images, which are unlabelled base64 blobs in the brief: see
 * `scripts/build-product-renders.py`, which decodes the same folders and is the
 * only other place the colour of a folder is asserted.
 *
 * Aluminium is a different palette of four named colours, shared by both
 * aluminium systems («КАК У ХОЛОДНОГО АЛЮМИН»).
 */
const PVC_PALETTE = [
  "white",
  "light-oak",
  "golden-oak",
  "nut",
  "dark-oak",
  "grey",
  "anthracite",
] as const;

const ALUMINIUM_PALETTE = ["white", "golden-oak", "brown", "anthracite"] as const;

/**
 * Swatch fills for the colour row. Locale-independent, hence here and not in
 * the message catalogue; sampled from the opaque frame pixels of each render.
 *
 * A swatch is a hint, not a colour proof — the renders are. Aluminium's
 * «золотой дуб» is a warmer, more coppery coat than the PVC lamination of the
 * same name and shares this one value; the gallery shows the difference.
 */
export const colorSwatches: Record<string, string> = {
  white: "#f2f2f0",
  "light-oak": "#c3af92",
  "golden-oak": "#b08a30",
  nut: "#5f412b",
  "dark-oak": "#3e2a1c",
  grey: "#8f8a80",
  anthracite: "#3a4344",
  brown: "#57423a",
};

/**
 * Every colourway of a system has the same five camera angles, so the gallery
 * is described by its exceptions rather than by 150 literal paths.
 *
 * `angles` is the count for a colour that is not in `exceptions`; the renders
 * on disk are `/products/<slug>/<colour>/1.webp` … `<n>.webp`, emitted in that
 * order by `scripts/build-product-renders.py`.
 */
function galleryOf(
  slug: string,
  palette: readonly string[],
  angles: number,
  exceptions: Record<string, number> = {},
): Colorway[] {
  return palette.map((color) => ({
    color,
    images: Array.from(
      { length: exceptions[color] ?? angles },
      (_, index) => `/products/${slug}/${color}/${index + 1}.webp`,
    ),
  }));
}

function sectionsOf(slug: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `/products/${slug}/section-${index + 1}.webp`);
}

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
    // ⚠️ The client sent renders for five of the six systems; there is no
    // ЭКОЛАЙН folder in `notes/` at all (plan §"Заметки"). The page has to
    // survive that, so the gallery, the card render and the cutaways are all
    // empty here and every block that draws them falls back to the neutral
    // placeholder. Requested from the client — white renders would fill this.
    gallery: [],
    sections: [],
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
    colors: [...PVC_PALETTE],
    images: ["/products/roller/roller-main.png"],
    gallery: galleryOf("roller", PVC_PALETTE, 5),
    sections: sectionsOf("roller", 3),
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
    colors: [...PVC_PALETTE],
    images: ["/products/unopen/unopen-main.png"],
    // White is three angles, not five: one of its source files was an
    // anthracite window filed in the white folder and was dropped rather than
    // shipped as white. `SpecTable`-style flexibility applies to the gallery
    // too — nothing may assume a fixed angle count.
    gallery: galleryOf("unopen", PVC_PALETTE, 5, { white: 3 }),
    sections: sectionsOf("unopen", 2),
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
    colors: [...PVC_PALETTE],
    images: ["/products/stella/stella-main.png"],
    gallery: galleryOf("stella", PVC_PALETTE, 5),
    sections: sectionsOf("stella", 2),
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
    colors: [...ALUMINIUM_PALETTE],
    images: ["/products/ald-45/ald-45-white.png"],
    gallery: galleryOf("ald-45", ALUMINIUM_PALETTE, 5),
    // The aluminium renders include no cutaway — an edge-on view of the closed
    // frame is the closest the client shot, and it goes in the gallery as the
    // last angle rather than pretending to be a section drawing.
    sections: [],
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
    colors: [...ALUMINIUM_PALETTE],
    images: ["/products/thermo-60/thermo-60-anthracite.png"],
    gallery: galleryOf("thermo-60", ALUMINIUM_PALETTE, 5),
    sections: [],
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

/**
 * Systems shown as "other systems", nearest rung of the ladder first.
 *
 * The plan asks for "соседи по сегменту и по категории", and the two are one
 * list rather than two blocks: with six systems in total, a second grid would
 * repeat most of the first. Ordering by distance along the segment ladder is
 * what makes it a neighbour list — from ROLLER, UNOPEN is one rung away and
 * ЭКОЛАЙН one rung the other way, and both come before STELLA.
 */
export function relatedProducts(product: ProductBase): ProductBase[] {
  const rung = (candidate: ProductBase) => segments.indexOf(candidate.segment);

  return productsByCategory(product.categorySlug)
    .filter((candidate) => candidate.slug !== product.slug)
    .sort((a, b) => Math.abs(rung(a) - rung(product)) - Math.abs(rung(b) - rung(product)));
}

/**
 * The product at `/catalog/[category]/[product]`, or `undefined`.
 *
 * Both segments are checked, not just the slug: `/catalog/aluminium/roller`
 * addresses a system that exists under a category it does not belong to, and
 * answering it would give the page two URLs — the one thing `localePrefix:
 * "always"` was chosen to avoid in `i18n/routing.ts`.
 */
export function findProduct(category: string, slug: string): ProductBase | undefined {
  return products.find((product) => product.categorySlug === category && product.slug === slug);
}

/** Every `/catalog/[category]/[product]` pair, for `generateStaticParams`. */
export const productParams = products.map((product) => ({
  category: product.categorySlug,
  product: product.slug,
}));
