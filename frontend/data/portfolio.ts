import type { ProjectCategory } from "@/types";

/**
 * Portfolio mock (`project_plan/07-secondary-pages.md`).
 *
 * ⚠️ **This content is invented and must not ship.** Section 10.2 of the brief
 * is empty — the client listed no objects at all — so every project below is a
 * plausible placeholder, and the images are product renders standing in for
 * photographs that do not exist yet. DESIGN.md §6 п.3 bans stock photography in
 * the portfolio outright, and this page stays behind the client's own shoot
 * (open question №2/№3). The layout is what is being delivered here, not the
 * content.
 *
 * Same split as the rest of `data/`: this file holds only what is identical in
 * all four locales; every word lives in `messages/*.json` under
 * `projects.items.<id>`.
 */

export interface ProjectRecord {
  /** Key into the message catalogue. */
  id: string;
  /** URL segment. Latin in every locale, like every other slug on the site. */
  slug: string;
  category: ProjectCategory;
  /** Cover image. */
  image: string;
  /** Cover first, then the remaining angles. Never empty. */
  gallery: string[];
  /** Systems used, as catalog product slugs — the link back to the catalog. */
  systems: string[];
  year: number;
}

export const projects: ProjectRecord[] = [
  {
    id: "residential-complex-dushanbe",
    slug: "residential-complex-dushanbe",
    category: "residential",
    image: "/products/stella/stella-main.png",
    gallery: ["/products/stella/stella-main.png", "/products/stella/white/1.webp"],
    systems: ["stella"],
    year: 2025,
  },
  {
    id: "business-center-khujand",
    slug: "business-center-khujand",
    category: "commercial",
    image: "/products/thermo-60/thermo-60-anthracite.png",
    gallery: [
      "/products/thermo-60/thermo-60-anthracite.png",
      "/products/thermo-60/anthracite/1.webp",
    ],
    systems: ["thermo-60"],
    year: 2025,
  },
  {
    id: "private-house-vahdat",
    slug: "private-house-vahdat",
    category: "private",
    image: "/products/roller/roller-main.png",
    gallery: ["/products/roller/roller-main.png", "/products/roller/golden-oak/1.webp"],
    systems: ["roller"],
    year: 2024,
  },
  {
    id: "shopping-mall-bokhtar",
    slug: "shopping-mall-bokhtar",
    category: "commercial",
    image: "/products/unopen/unopen-main.png",
    gallery: ["/products/unopen/unopen-main.png", "/products/ald-45/ald-45-white.png"],
    systems: ["unopen", "ald-45"],
    year: 2024,
  },
  {
    id: "apartment-renovation-dushanbe",
    slug: "apartment-renovation-dushanbe",
    category: "residential",
    image: "/products/ald-45/ald-45-white.png",
    gallery: ["/products/ald-45/ald-45-white.png"],
    systems: ["ald-45"],
    year: 2023,
  },
];

export const projectCategories: ProjectCategory[] = ["residential", "commercial", "private"];

export function projectHref(slug: string): string {
  return `/products/${slug}`;
}

export function findProjectBySlug(slug: string): ProjectRecord | undefined {
  return projects.find((project) => project.slug === slug);
}

/** Neighbouring objects on a project page — same category first. */
export function relatedProjects(project: ProjectRecord): ProjectRecord[] {
  return projects
    .filter((candidate) => candidate.slug !== project.slug)
    .sort(
      (a, b) => Number(b.category === project.category) - Number(a.category === project.category),
    )
    .slice(0, 3);
}

export const projectParams = projects.map((project) => ({ project: project.slug }));
