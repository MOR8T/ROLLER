import schemes from "@/data/calculator-schemes.json";
import { products, productsByCategory, type ProductBase } from "@/data/products";

/**
 * The calculator's option lists and the geometry behind its preview
 * (`project_plan/06-*.md`).
 *
 * The page is modelled on `imzo.uz/calculator`: a construction is picked from
 * drawn variants, sized with two sliders, finished in «Детали расчёта» and
 * sent as a request. Nothing here is a price — the brief forbids showing one
 * (§5.3) and none of these parameters could produce one.
 *
 * ⚠️ Still the frontend half of **open question №1**: nobody has decided
 * whether these lists live in Postgres as reference tables or stay here. So
 * everything is keys and numbers, every label lives in `messages/*.json` under
 * `calculator.*`, and the per-system record is the join table a migration
 * would create.
 */

export type ConstructionKind = "window" | "door";
export type MaterialKind = "pvc" | "aluminium";

export type GlazingKey =
  "single-glass" | "single-chamber" | "double-chamber" | "double-chamber-energy";

export type AccessoryKey = "windowsill" | "mosquito-net" | "drip";

/** Per pane, read off the red indicator lines in the source drawings. */
export type OpeningType = "fixed" | "casement" | "tilt" | "tilt-turn";

export const constructionKinds: ConstructionKind[] = ["window", "door"];
export const materials: MaterialKind[] = ["pvc", "aluminium"];

/**
 * The lamination palette.
 *
 * Five colours, because five is what the company laminates — the client's
 * `public/cal/texture.svg` is a sheet of exactly these swatches, and
 * `scripts/parse-calculator-schemes.py`'s sibling step cut them out into
 * `public/cal/textures/`. The keys are the catalogue's own colour keys, so the
 * labels come from `messages.colors` and no new strings are needed.
 *
 * The same five are offered for hardware: the client confirmed on 2026-08-23
 * that handles ship in the lamination colours rather than in a palette of
 * their own.
 */
export const laminations = ["white", "anthracite", "nut", "golden-oak", "dark-oak"] as const;
export type LaminationKey = (typeof laminations)[number];

export const hardwareColors = laminations;

export function textureUrl(color: LaminationKey): string {
  return `/cal/textures/${color}.png`;
}

/**
 * ⚠️ Placeholder. «Механизм» is a field `imzo.uz` fills with a hardware brand
 * (Fornax); the client said on 2026-08-23 they would send the list of brands
 * ROLLER actually fits, and it has not arrived. Inventing brand names on a
 * manufacturer's own site is not a placeholder, it is a false claim — so the
 * select renders with one neutral entry until the list lands, and the only
 * edit needed then is this array plus `calculator.mechanisms.*` in the four
 * message catalogues.
 */
export const mechanisms = ["standard"] as const;
export type MechanismKey = (typeof mechanisms)[number];

interface SystemOptions {
  glazing: GlazingKey[];
}

/**
 * What a given profile system can be glazed with.
 *
 * The ladder follows the chamber count: a 3-chamber economy frame takes a
 * single-chamber unit, a 75 mm premium frame does not sell with one. ALD-45 is
 * cold aluminium and single glass is its normal fill.
 */
const systemOptions: Record<string, SystemOptions> = {
  ecoline: { glazing: ["single-chamber"] },
  roller: { glazing: ["single-chamber", "double-chamber"] },
  unopen: { glazing: ["single-chamber", "double-chamber", "double-chamber-energy"] },
  stella: { glazing: ["double-chamber", "double-chamber-energy"] },
  "ald-45": { glazing: ["single-glass", "single-chamber"] },
  "thermo-60": { glazing: ["single-chamber", "double-chamber", "double-chamber-energy"] },
};

export interface Range {
  min: number;
  max: number;
  step: number;
  default: number;
}

/**
 * Size ranges in millimetres. Ordinary manufacturing limits, not a pricing
 * input — the surveyor needs them regardless, and they turn a request into
 * something the sales desk can act on.
 */
export const sizeLimits: Record<ConstructionKind, { width: Range; height: Range }> = {
  window: {
    width: { min: 400, max: 3000, step: 10, default: 1400 },
    height: { min: 400, max: 2500, step: 10, default: 1400 },
  },
  door: {
    width: { min: 700, max: 2400, step: 10, default: 900 },
    height: { min: 1800, max: 2800, step: 10, default: 2100 },
  },
};

export const MAX_ITEMS = 8;
export const MAX_QUANTITY = 99;

export const accessories: { key: AccessoryKey; constructions: ConstructionKind[] }[] = [
  { key: "windowsill", constructions: ["window"] },
  { key: "mosquito-net", constructions: ["window", "door"] },
  { key: "drip", constructions: ["window"] },
];

/* -------------------------------------------------------------------------- */
/* Variants                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A drawn variant — one of the 55 schemes in `public/cal/`.
 *
 * The drawing is the thumbnail; `panes` and `arch` are the same drawing read
 * as geometry, so the preview can be rendered with the lamination texture on
 * the profile and glass in the openings. Both come out of
 * `scripts/parse-calculator-schemes.py`; nothing here is written by hand.
 */
export interface Pane {
  /** `[x0, y0, x1, y1]` in the drawing's own coordinates. */
  box: number[];
  opening: OpeningType;
  hinge: "left" | "right" | "bottom" | null;
}

export interface ArchHead extends Omit<Pane, "box"> {
  /** The arc itself, lifted from the drawing. */
  d: string;
  /** Where the arc springs, and the rail it closes on. */
  spring: number;
  foot: number;
  box: number[];
}

export interface SchemeRoles {
  /** Paths that draw a handle or a hinge, by index into the file's path order. */
  hardware: number[];
  /** Paths that draw the variant number stamped on the drawing. */
  label: number[];
}

export interface Scheme {
  id: string;
  kind: ConstructionKind;
  vw: number;
  vh: number;
  outer: number[];
  profile: number;
  arch: ArchHead | null;
  /** How many sashes wide the variant reads — the group it belongs to. */
  columns: number;
  roles: SchemeRoles;
  panes: Pane[];
}

export const allSchemes = schemes as Scheme[];

export function findScheme(id: string): Scheme | undefined {
  return allSchemes.find((scheme) => scheme.id === id);
}

export function schemeUrl(scheme: Scheme): string {
  return `/cal/${scheme.kind === "window" ? "windows" : "doors"}/${scheme.id}.svg`;
}

export interface VariantGroup {
  columns: number;
  variants: Scheme[];
}

/**
 * The variants of a construction, grouped the way `imzo.uz` groups them —
 * by how many sashes wide they are, with everything else (a transom, an arched
 * head, a fanlight divided more finely than the sashes under it) sitting as a
 * variation inside its group.
 */
export function variantGroups(construction: ConstructionKind): VariantGroup[] {
  const groups = new Map<number, Scheme[]>();
  for (const scheme of allSchemes) {
    if (scheme.kind !== construction) continue;
    const bucket = groups.get(scheme.columns);
    if (bucket) bucket.push(scheme);
    else groups.set(scheme.columns, [scheme]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([columns, variants]) => ({ columns, variants }));
}

/* -------------------------------------------------------------------------- */
/* Systems                                                                     */
/* -------------------------------------------------------------------------- */

/** The category slug that makes a system available as this construction. */
const categoryOf: Record<ConstructionKind, string> = { window: "windows", door: "doors" };

/**
 * The systems on offer for a construction in a material.
 *
 * ⚠️ The material step is back. It was removed on 2026-08-17 — «не должно быть
 * разделения на ПВХ и алюминиевую продукцию» — and that decision still governs
 * the catalogue, where `material` is a characteristic and not an axis. Here it
 * is a field again because the client asked on 2026-08-23 for this page to
 * carry `imzo.uz`'s own «Тип профиля → Серия профиля» pair. Scoped to the
 * calculator; the catalogue is untouched.
 */
export function systemsFor(construction: ConstructionKind, material: MaterialKind): ProductBase[] {
  return productsByCategory(categoryOf[construction]).filter(
    (product) => product.material === material,
  );
}

export function findSystem(slug: string): ProductBase | undefined {
  return products.find((product) => product.slug === slug);
}

export function glazingOf(slug: string): GlazingKey[] {
  const options = systemOptions[slug];
  if (!options) {
    // A system without an entry is a data bug, not a runtime state to paper
    // over: the calculator would offer it with no glazing at all.
    throw new Error(`No calculator options declared for system "${slug}"`);
  }
  return options.glazing;
}

export function accessoriesFor(construction: ConstructionKind): AccessoryKey[] {
  return accessories
    .filter((accessory) => accessory.constructions.includes(construction))
    .map((accessory) => accessory.key);
}

/* -------------------------------------------------------------------------- */
/* One position of a request                                                   */
/* -------------------------------------------------------------------------- */

export interface ConfiguredItem {
  id: string;
  construction: ConstructionKind;
  material: MaterialKind;
  /** Product slug from `data/products.ts`. */
  system: string;
  /** Scheme id from `data/calculator-schemes.json`. */
  variant: string;
  widthMm: number;
  heightMm: number;
  glazing: GlazingKey;
  mechanism: MechanismKey;
  lamination: LaminationKey;
  hardware: LaminationKey;
  accessories: AccessoryKey[];
  quantity: number;
}

export function createItem(id: string, construction: ConstructionKind = "window"): ConfiguredItem {
  const limits = sizeLimits[construction];
  const groups = variantGroups(construction);

  return reconcile({
    id,
    construction,
    material: "pvc",
    system: "",
    // Open on the simplest variant of the smallest group — a single sash reads
    // at a glance, and every other variant is one click from it.
    variant: groups[0].variants[0].id,
    widthMm: limits.width.default,
    heightMm: limits.height.default,
    glazing: "single-chamber",
    mechanism: mechanisms[0],
    lamination: "white",
    hardware: "white",
    accessories: [],
    quantity: 1,
  });
}

/**
 * Re-applies the cascade after a change.
 *
 * Every edit goes through here rather than through per-field guards, because
 * the invalid states all arise the same way: a choice that was legal under the
 * previous selection survives into the next one. Switching ПВХ → алюминий has
 * to drop a PVC series and the glazing that came with it, and switching a
 * window to a door has to drop a three-sash variant that doors do not have.
 */
export function reconcile(item: ConfiguredItem): ConfiguredItem {
  const available = systemsFor(item.construction, item.material);
  const material = available.length > 0 ? item.material : otherMaterial(item.material);
  const systems = available.length > 0 ? available : systemsFor(item.construction, material);
  const system = systems.some((product) => product.slug === item.system)
    ? item.system
    : (systems.find((product) => product.popular) ?? systems[0]).slug;

  const glazing = glazingOf(system);
  const limits = sizeLimits[item.construction];
  const allowed = accessoriesFor(item.construction);
  const scheme = findScheme(item.variant);
  const variant =
    scheme && scheme.kind === item.construction
      ? scheme.id
      : variantGroups(item.construction)[0].variants[0].id;

  return {
    ...item,
    material,
    system,
    variant,
    glazing: glazing.includes(item.glazing) ? item.glazing : glazing[0],
    mechanism: mechanisms.includes(item.mechanism) ? item.mechanism : mechanisms[0],
    lamination: laminations.includes(item.lamination) ? item.lamination : laminations[0],
    hardware: hardwareColors.includes(item.hardware) ? item.hardware : hardwareColors[0],
    widthMm: clamp(item.widthMm, limits.width),
    heightMm: clamp(item.heightMm, limits.height),
    accessories: item.accessories.filter((key) => allowed.includes(key)),
    quantity: Math.min(Math.max(Math.round(item.quantity) || 1, 1), MAX_QUANTITY),
  };
}

function otherMaterial(material: MaterialKind): MaterialKind {
  return material === "pvc" ? "aluminium" : "pvc";
}

export function clamp(value: number, range: Range): number {
  if (!Number.isFinite(value)) return range.default;
  return Math.min(Math.max(Math.round(value), range.min), range.max);
}
