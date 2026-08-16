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
 * ⚠️ Not enough for the calculator (stage 06), which needs machine-readable
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
 * One lamination colour of a system, together with the renders that show it.
 *
 * The client's source renders are filed exactly this way — a folder per colour,
 * and inside it several camera angles of **one and the same construction**
 * (`project_plan/05-product-page.md`). Flattening that into a single
 * `images: string[]` would throw away the only fact the product page needs from
 * it: which render is which colour. So the gallery is a list of colourways, and
 * switching colour swaps the whole set of angles rather than jumping to an
 * unrelated picture.
 *
 * `color` is a locale-independent key — labels live under `colors.*` in the
 * message catalogue, swatch values in `colorSwatches` (`data/catalog.ts`).
 */
export interface Colorway {
  color: string;
  /** Angles of the same construction, best first. Never empty. */
  images: string[];
}

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
  /**
   * The lamination palette the system is *sold* in, whether or not a render of
   * it exists — `gallery` is the second, narrower list. ЭКОЛАЙН is why the two
   * are separate fields: it ships in white and the client sent no renders at
   * all, so its swatch row has to come from somewhere other than the pictures.
   */
  colors: string[];
  /** The card render — one editorial pick per system, not the whole gallery. */
  images: string[];
  /** Colour-by-colour renders for the product page. Empty where none exist. */
  gallery: Colorway[];
  /**
   * Cutaway renders: chambers, reinforcement, the glazing bead. The "technical"
   * layer of DESIGN.md §6 — addressed to architects and dealers and kept off
   * the first screen, which §11 forbids outright. Empty for the aluminium
   * systems, which the client shot without a single cutaway.
   */
  sections: string[];
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

/**
 * Which of the three requests the visitor is making. The brief asks for one
 * form with a choice of scenario — «рассчитать» / «получить КП» /
 * «стать дилером» — and the value travels all the way through: it is stored
 * with the lead and written into the WhatsApp message, because a human sorts
 * the requests and no admin-side workflow exists (plan §06).
 */
export type LeadScenario = "calculate" | "quote" | "dealer";

export interface Lead {
  scenario: LeadScenario;
  name: string;
  phone: string;
  city: string;
  productType: string;
  comment?: string;
  /**
   * The calculator's read-out, already rendered as plain text in the
   * visitor's locale. Free text rather than a structured payload on purpose:
   * the sales desk reads it, and pinning a schema now would freeze option
   * lists that are still open question №1 in `project_plan/00-overview.md`.
   */
  configuration?: string;
}

export interface Cta {
  label: string;
  href: string;
}

/**
 * One slide of the homepage first screen.
 *
 * ⚠️ DESIGN.md §7 described the hero in the singular and §2 ruled out the
 * IMZO-style promo carousel outright. The client overrode both on 2026-08-11:
 * a single static panel could only ever say one thing, and the two halves of
 * the offer — ПВХ and алюминий — never reached the first screen at all. The
 * override is narrow: still one promise, one action *per slide*, and the
 * carousel stays inside the page container rather than taking the full screen,
 * so §5's rule that the next section's top edge is visible without scrolling
 * survives.
 */
export interface HeroSlide {
  /** Looks up `hero.slides.<key>.*` in the message catalogue. */
  key: string;
  /**
   * The "context" layer DESIGN.md §6 asks for — an interior, facade or
   * finished object. Every other image slot on the site is nullable because
   * this photography did not exist; the client delivered it on 2026-08-11 as
   * `public/banners/*.jpg`, so here it is required. §11's ban on profile
   * cutaways over the first screen is satisfied rather than overridden: these
   * are finished objects, and the renders they replaced were exactly what §11
   * meant.
   *
   * The banners carry the ROLLER mark and the brand's red/black corner
   * graphics in the pixels, which is why slide copy sits along the bottom edge
   * — see `hero-section.tsx`.
   */
  image: string;
  cta: Cta["href"];
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

/**
 * `ProjectTeaser` and `NewsTeaser` lived here until stage 07. They were
 * homepage-only shapes carrying a prebuilt `href`, and `/portfolio` and `/news`
 * need a slug they can route on instead — see `ProjectRecord` in
 * `data/portfolio.ts` and `ArticleRecord` in `data/news.ts`. The domain
 * contracts the backend must satisfy stay `Project` and `Article` above.
 */

export interface Partner {
  name: string;
  logo: string | null;
}

/**
 * A showroom pin on the homepage map (`ShowroomsSection`).
 *
 * ⚠️ `coordinates` is `[lng, lat]`, not `[lat, lng]`. Yandex JS API 3 broke
 * with 2.1 here — 2.1 took `[lat, lng]` and v3 takes GeoJSON order — and the
 * two are silently swappable for Tajikistan only in the sense that both are
 * plausible numbers: `[38.5, 68.7]` lands in the Arabian Sea instead of
 * Dushanbe, with no error. The `LngLat` name in the JS API types is the whole
 * warning it gives you.
 *
 * Nothing here is translated. The city name, street address and opening hours
 * live in `messages/*.json` under `home.showrooms.points.<id>` — an address in
 * Tajik is not the same string as an address in Russian, and the map has to
 * speak the locale the rest of the page is in.
 */
export interface Showroom {
  /** Also the message key under `showrooms.points`. */
  id: string;
  /** `[lng, lat]` — see the note above. */
  coordinates: [number, number];
  phone: string;
  phoneHref: string;
  /** Deep link into Yandex Maps: the "проложить маршрут" affordance. */
  routeUrl: string;
  /**
   * Photograph of the showroom, shown at the top of its card in the list view
   * of `/showroom`.
   *
   * `null` until the client's own shoot lands — DESIGN.md §6 п.2 is the rule
   * this follows, and `MediaFrame` renders the neutral hatched panel in the
   * meantime. The slot keeps its size either way, so the page does not reflow
   * on the day the photographs arrive.
   */
  photo: string | null;
}
