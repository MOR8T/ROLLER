import {
  AppWindow,
  Award,
  Blinds,
  Briefcase,
  Building2,
  Columns3,
  DoorOpen,
  Factory,
  Grid2x2,
  Headphones,
  Home,
  MoveHorizontal,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Partner } from "@/types";

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

/** Copy: `production.stats.<key>`. Values are formatted per locale on render. */
export interface CompanyStat {
  key: string;
  value: number;
  suffix: string;
}

export const companyStats: CompanyStat[] = [
  { key: "years", value: 20, suffix: "+" },
  { key: "projects", value: 1000, suffix: "+" },
  // { key: "clients", value: 1000, suffix: "+" },
  { key: "employees", value: 400, suffix: "+" },
  { key: "tonnage", value: 10000, suffix: "+" },
];

/**
 * The four numbers the homepage's "О компании" block shows, in IMZO's shape:
 * one big figure per claim, four across.
 *
 * It is a selection of `companyStats`, not a second list — `/about` still shows
 * all five, and two lists of the same facts is exactly how they drift apart.
 * `clients` is the one left out: "1000+ клиентов" and "1000+ объектов" are the
 * same claim twice, and a four-up row has no room for a duplicate.
 */
export const homeStatKeys = ["years", "projects", "employees", "tonnage"] as const;

export const homeStats: CompanyStat[] = homeStatKeys.map((key) =>
  companyStats.find((stat) => stat.key === key)!,
);

/**
 * The "Продукция" strip — seven photo cards, the way IMZO opens its catalogue
 * on the homepage rather than hiding it behind the menu.
 *
 * Six of the seven are the catalog's application axis, so their titles come
 * from `applications.items.*` and are translated once, in the place the catalog
 * page and the mega-menu already read them. A tile whose label had to be
 * repeated here would be the third copy of the same word.
 *
 * Every card is a thing you can want — a window, a door, a facade — never a
 * material. "ПВХ или алюминий?" is a manufacturer's question (DESIGN.md §7),
 * and the two cards that asked it were removed by the client on 2026-08-14;
 * both materials are still one click away, in the header menu and on `/catalog`
 * itself, which is where someone who thinks in materials is already heading.
 *
 * ⚠️ Two tiles have come off since this strip was built: the calculator
 * (2026-08-13, the only action among destinations and the only card without a
 * photograph) and the two material cards above. Seven is not an accident —
 * `home-carousel.tsx` duplicates a list too short for its own loop, and seven
 * against a widest `slidesPerView` of three clears that bar. Adding an eighth
 * is free; dropping to five is not.
 *
 * ── The photographs ─────────────────────────────────────────────────────────
 *
 * `image` is the client's own shoot, picked out of `notes/photos` (121 frames,
 * around 6000×4000 but not all the same size) and cropped to 3:4 at 900×1200
 * into `public/home/`. `notes/` is gitignored source material, so the seven
 * that ship live under `public/`.
 *
 * ⚠️ Two of the seven are approximations and the client should replace them:
 * there is no photograph of a mosquito net in the folder at all, and nothing
 * unambiguously *sliding* — both currently carry the nearest showroom frame.
 * Everything else is the thing it says it is; `accessories` is the showroom's
 * door handle and keys, which is what "фурнитура" looks like.
 *
 * `icon` is kept although the photograph covers the whole card: it is the
 * fallback the day a photograph is swapped out and the new one is late, and the
 * two cards flagged above are the ones most likely to be swapped.
 */
export type HomeProductTile = { icon: LucideIcon; image: string } & (
  { kind: "category"; slug: string } | { kind: "custom"; key: string; href: string }
);

export const homeProductTiles: HomeProductTile[] = [
  { kind: "category", slug: "windows", icon: AppWindow, image: "/home/windows.jpg" },
  { kind: "category", slug: "doors", icon: DoorOpen, image: "/home/doors.jpg" },
  {
    kind: "category",
    slug: "sliding-systems",
    icon: MoveHorizontal,
    image: "/home/sliding-systems.jpg",
  },
  {
    kind: "category",
    slug: "facade-glazing",
    icon: Building2,
    image: "/home/facade-glazing.jpg",
  },
  { kind: "category", slug: "partitions", icon: Columns3, image: "/home/partitions.jpg" },
  {
    kind: "category",
    slug: "mosquito-nets",
    icon: Grid2x2,
    image: "/home/mosquito-nets.jpg",
  },
  // ⚠️ The only tile with copy of its own, and the only one whose destination
  // is a placeholder. There is no accessories page: `ProductKind` already has
  // the `"component"` member for handles, windowsills, trunking and cylinders,
  // and `data/products.ts` says outright that none of them are in the catalogue
  // at launch. So this points at `/catalog`, which is where they will appear.
  // Give it the real route the moment that content exists.
  {
    kind: "custom",
    key: "accessories",
    href: "/products",
    icon: Blinds,
    image: "/home/accessories.jpg",
  },
];

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
 * Every `href` is a route that exists. Copy: `home.offers.tabs.<key>`.
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
    cta: "/products",
    links: [
      { key: "stella", href: "/products/stella" },
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
      { key: "systems", href: "/products" },
      { key: "portfolio", href: "/portfolio" },
    ],
  },
];

export const partners: Partner[] = [
  {
    name: "Krauss Maffei",
    logo: "/partners_logo/akpen_2.png",
  },
  {
    name: "Renolit",
    logo: "/partners_logo/akpen.png",
  },
  {
    name: "Mikrosan",
    logo: "/partners_logo/celikas.png",
  },
  {
    name: "Akdeniz",
    logo: "/partners_logo/dogus_iki.png",
  },
  {
    name: "Dow",
    logo: "/partners_logo/fornax_2.png",
  },
  {
    name: "Kronos",
    logo: "/partners_logo/fornax.png",
  },
  {
    name: "Baerlocher",
    logo: "/partners_logo/heywin.png",
  },
  {
    name: "CNT Conta",
    logo: "/partners_logo/winax.png",
  },
] as const;

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
