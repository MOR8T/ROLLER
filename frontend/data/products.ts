import type { Category, Colorway, Product, Segment } from "@/types";

/**
 * The catalog: six categories and six profile systems, on one axis.
 *
 * ⚠️ It had two axes until 2026-08-17 — **category** meaning the material
 * (`pvc` / `aluminium`, one per product, and the product's URL) and
 * **application** meaning what the system is for. The client removed the first
 * one: «не должно быть разделения на ПВХ и алюминиевую продукцию». So the
 * applications *became* the categories, material dropped to a characteristic
 * (`Product.material`), and the product URL briefly lost its category segment —
 * it came back on 2026-08-20, once per claim, see `productHref`.
 *
 * What is left is the shape the API will return and the admin panel will edit:
 * a list of categories, each carrying the slugs of its products, many-to-many
 * and free to grow. Nothing in this file may treat six as the number of
 * categories or `windows` as a category that must exist.
 *
 * Same split as `data/home.ts` and for the same reason: this file holds only
 * what is identical in all four locales — slugs, image paths, numbers, the
 * category↔product links. Every word lives in `messages/{ru,tj,en,tr}.json`
 * and is looked up by slug. On the backend the text half becomes JSONB
 * (`project_plan/10-database-schema.md`), so components already consume the two
 * halves the way they will once the API exists.
 *
 * Each `…Base` type is the domain interface from `@/types` minus the fields the
 * message catalogue supplies, so the contract stays visible in one place.
 */

/**
 * Copy: `categories.items.<slug>`.
 *
 * The list is the plan's application axis, in the plan's order. It replaced an
 * earlier set of *situations* (`apartment`, `house`, `commercial`, `facade`)
 * that the homepage shipped in stage 02: a situation cannot be a facet on a
 * product — every system suits every situation — so it could never satisfy the
 * many-to-many link this axis exists for.
 *
 * `image` is `null` throughout: context-layer photography (interiors, facades,
 * finished objects) does not exist yet, and DESIGN.md §6 п.2 requires those
 * slots to be data fields the client fills through the admin panel rather than
 * hardcoded paths.
 *
 * `productSlugs` is the former `Product.applicationSlugs`, read the other way
 * round. Same links, same order of systems as `products` below — the ladder
 * from economy to premium — but written where the API and the admin panel will
 * keep them.
 */
export type CategoryBase = Omit<Category, "title" | "description">;

export const categories: CategoryBase[] = [
  {
    slug: "windows",
    image: null,
    productSlugs: ["ecoline", "roller", "unopen", "stella", "thermo-60"],
  },
  {
    slug: "doors",
    image: null,
    productSlugs: ["ecoline", "roller", "unopen", "stella", "ald-45", "thermo-60"],
  },
  {
    slug: "sliding-systems",
    image: null,
    productSlugs: ["unopen", "ald-45", "thermo-60"],
  },
  {
    slug: "facade-glazing",
    image: null,
    productSlugs: ["ald-45", "thermo-60"],
  },
  {
    slug: "mosquito-nets",
    image: null,
    productSlugs: [],
  },
  {
    slug: "partitions",
    image: null,
    productSlugs: ["ald-45"],
  },
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
    material: "pvc",
    segment: "economy",
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
    material: "pvc",
    segment: "mid",
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
    material: "pvc",
    segment: "upper-mid",
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
    material: "pvc",
    segment: "premium",
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
    material: "aluminium",
    materialNote: "cold",
    segment: "economy",
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
    material: "aluminium",
    materialNote: "warm",
    segment: "premium",
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

export function isCategorySlug(value: string): boolean {
  return categorySlugs.includes(value);
}

/**
 * The one place the product URL is built: `/products/<category>/<product>`.
 *
 * ⚠️ It was flat — `/products/<product>` — until 2026-08-20, because a system
 * belongs to several categories and no single one of them is "the" parent. The
 * client asked for the category back in the address, so a system now has as
 * many URLs as it has categories and every one of them renders. `category`
 * therefore says *which link the visitor followed*, not what the product is:
 * pass the category whose list the link sits in, and the page keeps the
 * visitor's context.
 *
 * With no category given the product's first one stands in. A product in no
 * category has no product URL at all and the catalog index answers instead —
 * an empty category is a normal state between creating one and filling it,
 * and a link to `/products/undefined/roller` would not be.
 */
export function productHref(product: ProductBase, categorySlug?: string): string {
  const category = categorySlug ?? categoriesOfProduct(product)[0]?.slug;
  if (!category) return "/products";

  return `/products/${category}/${product.slug}`;
}

/**
 * The category landing.
 *
 * ⚠️ Still `/solutions/…`, not `/products/…`. `/products/[category]` is not a
 * page — the category segment there only prefixes a product — and these landings
 * carry the brief's search terms (§14.2) at URLs that have not changed since
 * stage 04, so keeping them is what protects the indexing, not inertia.
 */
export function categoryHref(slug: string): string {
  return `/solutions/${slug}`;
}

export function findCategory(slug: string): CategoryBase | undefined {
  return categories.find((category) => category.slug === slug);
}

/** The products of a category, in the order the category lists them. */
export function productsByCategory(slug: string): ProductBase[] {
  const category = findCategory(slug);
  if (!category) return [];

  return category.productSlugs
    .map((productSlug) => products.find((product) => product.slug === productSlug))
    .filter((product): product is ProductBase => Boolean(product));
}

/** The categories a product is listed in, in the canonical list order. */
export function categoriesOfProduct(product: ProductBase): CategoryBase[] {
  return categories.filter((category) => category.productSlugs.includes(product.slug));
}

/**
 * Systems shown as "other systems", nearest rung of the ladder first.
 *
 * The plan asks for "соседи по сегменту и по категории", and the two are one
 * list rather than two blocks: with six systems in total, a second grid would
 * repeat most of the first. Ordering by distance along the segment ladder is
 * what makes it a neighbour list — from ROLLER, UNOPEN is one rung away and
 * ЭКОЛАЙН one rung the other way, and both come before STELLA.
 *
 * "По категории" now means *sharing* a category rather than living in the same
 * one, since a system has several. A system that shares none still appears —
 * after the ones that do — because six systems cannot fill a grid twice and an
 * empty "другие системы" block would be worse than a loose neighbour.
 */
export function relatedProducts(product: ProductBase): ProductBase[] {
  const own = categoriesOfProduct(product).map((category) => category.slug);
  const shares = (candidate: ProductBase) =>
    categoriesOfProduct(candidate).some((category) => own.includes(category.slug)) ? 0 : 1;
  const rung = (candidate: ProductBase) => segments.indexOf(candidate.segment);

  return products
    .filter((candidate) => candidate.slug !== product.slug)
    .sort(
      (a, b) =>
        shares(a) - shares(b) ||
        Math.abs(rung(a) - rung(product)) - Math.abs(rung(b) - rung(product)),
    );
}

/** The product at `/products/[category]/[product]`, or `undefined`. */
export function findProduct(slug: string): ProductBase | undefined {
  return products.find((product) => product.slug === slug);
}

/**
 * Every `/products/[category]/[product]`, for `generateStaticParams`.
 *
 * A pair per link, not per product: ROLLER is in «Окна» and «Двери» and is
 * prerendered under both.
 */
export const productParams = categories.flatMap((category) =>
  category.productSlugs.map((product) => ({ category: category.slug, product })),
);
