import {
  Award,
  Briefcase,
  Factory,
  Headphones,
  Home,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
/**
 * Mock content for the homepage.
 *
 * Since stage 03 this file holds only what is **the same in all four locales**:
 * slugs, routes, image paths, icons and numbers. Every word on screen lives in
 * `messages/{ru,tj,en,tr}.json` and is looked up by the `slug` / `key` fields
 * below.
 *
 * The split is not cosmetic. `data/` is the stand-in for the API, and the API
 * will return a system's depth as `60` in every language but its `audience`
 * line as four different sentences (JSONB per
 * `project_plan/10-database-schema.md`). Keeping the two apart here means the
 * components already consume them the way they will once the backend exists.
 *
 * Each `…Base` type is the domain interface from `@/types` minus the fields the
 * message catalogue supplies, so the contract stays visible in one place.
 *
 * ⚠️ The catalog itself — categories, applications and the six profile systems —
 * moved to `data/products.ts` in stage 04. It stopped being homepage mock data
 * the moment `/catalog` and `/solutions/[application]` started reading it, and
 * the homepage's brand lineup now renders the same `products` array the catalog
 * grid does rather than a second copy of the six systems.
 */

/** Copy: `advantages.<key>`. */
export const advantages = [
  { key: "own-production", icon: Factory },
  { key: "materials", icon: Award },
  { key: "warranty", icon: ShieldCheck },
  { key: "measurement", icon: Ruler },
  { key: "installation", icon: Wrench },
  { key: "delivery", icon: Truck },
  { key: "service", icon: Headphones },
] as const;

/**
 * ⚠️ The "Продукция" strip's seven photo tiles moved from this static
 * fixture to the admin panel on 2026-08-27 — `lib/product-categories.ts`
 * fetches them, managed from `app/admin/(dashboard)/product-categories/page.tsx`.
 * `ProductsGridSection` reads that module directly; nothing here backs it
 * any more.
 */

/**
 * "Предложения для покупателей" — three tabs, one per audience.
 *
 * IMZO splits the same block by *place* (загородный дом / бизнес / импортные
 * системы). Ours splits by who is asking, because that is the split the rest of
 * the site already makes: the hero deck runs жильё → коммерция → частный дом,
 * and the request form offers «Рассчитать» / «Получить КП» / «Стать дилером».
 * A visitor who recognises themselves in a tab lands on pages written for them
 * instead of on a material they have no way to choose between.
 *
 * ⚠️ `href`s here are not all live routes. The three that pointed into the
 * catalogue now point at `/#products`, the homepage's own category strip: the
 * catalogue index was removed on 2026-08-28 and a product's address is a pair
 * of database ids (`/products/<category_id>/<product_id>`), which a static
 * fixture cannot spell. The `/solutions/<category>` landings and `/portfolio`
 * in this list were already addresses without pages before that change —
 * unrelated, and left as they are.
 *
 * Copy: `home.offers.tabs.<key>`.
 */
export interface HomeOfferLink {
  key: string;
  href: string;
}

export interface HomeOffer {
  key: string;
  icon: LucideIcon;
  /** Where the tab's own button goes — the page that covers the whole audience. */
  cta: string;
  links: HomeOfferLink[];
}

export const homeOffers: HomeOffer[] = [
  {
    key: "apartment",
    icon: Home,
    cta: "/solutions/windows",
    links: [
      { key: "windows", href: "/solutions/windows" },
      { key: "sliding", href: "/solutions/sliding-systems" },
      { key: "nets", href: "/solutions/mosquito-nets" },
      { key: "calculator", href: "/calculator" },
    ],
  },
  {
    key: "house",
    icon: Store,
    cta: "/#products",
    links: [
      { key: "stella", href: "/#products" },
      { key: "doors", href: "/solutions/doors" },
      { key: "sliding", href: "/solutions/sliding-systems" },
      { key: "showroom", href: "/showroom" },
    ],
  },
  {
    key: "business",
    icon: Briefcase,
    cta: "/solutions/facade-glazing",
    links: [
      { key: "facade", href: "/solutions/facade-glazing" },
      { key: "partitions", href: "/solutions/partitions" },
      { key: "systems", href: "/#products" },
      { key: "portfolio", href: "/portfolio" },
    ],
  },
];

/**
 * Copy: `production.steps.<key>`. Rendered by the homepage's "О компании" block
 * — the one part of the retired "Производство и масштаб" section that says
 * something the numbers do not: that замер, производство, монтаж and сервис are
 * all ours.
 */
export const serviceHighlights = [
  { key: "measure", icon: Ruler },
  { key: "manufacture", icon: PackageCheck },
  { key: "installation", icon: Wrench },
  { key: "service", icon: Headphones },
] as const;

// "Профессионалам" — the one dark section on the page. The dark ground is the
// marker that the audience has changed (DESIGN.md §3 п.2), not decoration.
// Copy: `professionals.offerings.<key>`.
export const proOfferingKeys = ["wholesale", "dealership", "components", "documentation"] as const;

/**
 * ⚠️ The portfolio and the news list moved to `data/portfolio.ts` and
 * `data/news.ts` in stage 07. They stopped being homepage mock data the moment
 * `/portfolio` and `/news` started reading them — the same move the catalog
 * made in stage 04. News moved twice more after that: to
 * `data/news/<locale>.json` on 2026-08-17, then to the backend on 2026-08-24
 * (`news_articles` table, managed from `app/admin/(dashboard)/news/page.tsx`) —
 * `lib/news.ts` is still the one seam every page reads through, only what is
 * behind it changed.
 */
