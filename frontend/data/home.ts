import {
  Award,
  Factory,
  Headphones,
  PackageCheck,
  Ruler,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";
import type { HeroSlide, Partner } from "@/types";

/**
 * Mock content for the homepage.
 *
 * Since stage 03 this file holds only what is **the same in all four locales**:
 * slugs, routes, image paths, icons and numbers. Every word on screen lives in
 * `messages/{ru,tg,en,tr}.json` and is looked up by the `slug` / `key` fields
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
 * moved to `data/catalog.ts` in stage 04. It stopped being homepage mock data
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
  { key: "years", value: 20, suffix: "" },
  { key: "projects", value: 1000, suffix: "+" },
  { key: "clients", value: 1000, suffix: "+" },
  { key: "employees", value: 400, suffix: "" },
  { key: "tonnage", value: 10000, suffix: "+" },
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

/** Copy: `production.steps.<key>`. */
export const serviceHighlights = [
  { key: "measure", icon: Ruler },
  { key: "manufacture", icon: PackageCheck },
  { key: "installation", icon: Wrench },
  { key: "service", icon: Headphones },
] as const;

/**
 * The first screen — one banner, one line and one action per slide.
 *
 * The order is a funnel, not a gallery: the promise first, then the two
 * audiences the brief names (застройщик, коммерция), then the private client.
 * It stops at four because that is the whole set the client shot; the deck is
 * an override of DESIGN.md §2 (see `HeroSlide` in `@/types`) and growing it
 * past its source material is how it would become the promo carousel §2
 * actually warned about.
 *
 * Slide 1's CTA is a same-page fragment and carries no locale prefix —
 * `ButtonLink` routes it through a plain `<a>` — while the rest point at real
 * routes and go through the locale-aware `Link`.
 *
 * Copy: `hero.slides.<key>.{eyebrow,headline,cta,imageLabel}`.
 */
export const heroSlides: HeroSlide[] = [
  {
    key: "promise",
    image: "/banners/banner_1.jpg",
    cta: "#brands",
  },
  {
    key: "residential",
    image: "/banners/banner_2.jpg",
    cta: "/products",
  },
  {
    key: "commercial",
    image: "/banners/banner_3.jpg",
    cta: "/catalog/aluminium",
  },
  {
    key: "private",
    image: "/banners/banner_4.jpg",
    cta: "/catalog/pvc",
  },
];

// "Профессионалам" — the one dark section on the page. The dark ground is the
// marker that the audience has changed (DESIGN.md §3 п.2), not decoration.
// Copy: `professionals.offerings.<key>`.
export const proOfferingKeys = ["wholesale", "dealership", "components", "documentation"] as const;

/**
 * ⚠️ The portfolio and the news list moved to `data/portfolio.ts` and
 * `data/news.ts` in stage 07. They stopped being homepage mock data the moment
 * `/portfolio` and `/news` started reading them — the same move the catalog
 * made in stage 04.
 */
