import { products, productsByCategory, type ProductBase } from "@/data/products";

/**
 * Option lists for the calculator (`project_plan/06-*.md`).
 *
 * ⚠️ This file is the frontend half of **open question №1**: nobody has decided
 * yet whether the option lists live in Postgres as reference tables (`Color`,
 * `GlazingOption`, `OpeningType` + per-system links) or stay in the frontend.
 * The plan's instruction is that whichever way it goes, the shape has to be
 * machine-readable *now* rather than the free-text `Spec` pairs the catalog
 * uses — so everything below is keys and numbers, every label lives in
 * `messages/*.json` under `calculator.*`, and the per-system record is
 * exactly the join table a migration would create.
 *
 * Nothing here is a price. The calculator gives the *feeling* of a
 * calculation and ends in a request; the brief forbids showing prices (§5.3)
 * and the parameters it lists could not produce one anyway.
 */

export type ConstructionKind = "window" | "door";

/** Per sash. The brief only distinguishes «откидной механизм и обычный». */
export type OpeningType = "fixed" | "casement" | "tilt-turn";

export type DoorLayout = "single" | "double" | "transom";

export type GlazingKey =
  "single-glass" | "single-chamber" | "double-chamber" | "double-chamber-energy";

export type AccessoryKey = "windowsill" | "mosquito-net";

export const constructionKinds: ConstructionKind[] = ["window", "door"];

export const doorLayouts: DoorLayout[] = ["single", "double", "transom"];

/**
 * What a given profile system can actually be built as.
 *
 * `constructions` is derived from the catalog rather than repeated here — a
 * system is offered as a window exactly when it is listed under the `windows`
 * application, and duplicating that would let the two lists drift.
 */
export interface SystemOptions {
  glazing: GlazingKey[];
  openings: OpeningType[];
}

/**
 * The cascade the plan asks for, in one table: material → system → what the
 * system allows.
 *
 * ЭКОЛАЙН is the case that proves it works. Its palette is `["white"]` in
 * `data/products.ts` (the client's own warranty text covers white profile only),
 * so choosing it collapses the colour row to a single swatch without any rule
 * being written here — the colours come from the catalog, not from this file.
 *
 * The glazing ladder follows the chamber count: a 3-chamber economy frame
 * takes a single-chamber unit, a 75 mm premium frame does not sell with one.
 * ALD-45 is cold aluminium — single glass is its normal fill and a tilt-turn
 * mechanism is not offered on it.
 */
const systemOptions: Record<string, SystemOptions> = {
  ecoline: {
    glazing: ["single-chamber"],
    openings: ["fixed", "casement", "tilt-turn"],
  },
  roller: {
    glazing: ["single-chamber", "double-chamber"],
    openings: ["fixed", "casement", "tilt-turn"],
  },
  unopen: {
    glazing: ["single-chamber", "double-chamber", "double-chamber-energy"],
    openings: ["fixed", "casement", "tilt-turn"],
  },
  stella: {
    glazing: ["double-chamber", "double-chamber-energy"],
    openings: ["fixed", "casement", "tilt-turn"],
  },
  "ald-45": {
    glazing: ["single-glass", "single-chamber"],
    openings: ["fixed", "casement"],
  },
  "thermo-60": {
    glazing: ["single-chamber", "double-chamber", "double-chamber-energy"],
    openings: ["fixed", "casement", "tilt-turn"],
  },
};

/**
 * Size ranges in millimetres.
 *
 * The brief left «размеры» unticked (§8.3), and the plan adds them anyway: the
 * surveyor needs them regardless, and they turn a request into something the
 * sales desk can act on. The bounds are ordinary manufacturing limits, not a
 * pricing input.
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

export interface Range {
  min: number;
  max: number;
  step: number;
  default: number;
}

export const MAX_SASHES = 3;
export const MAX_ITEMS = 6;
export const MAX_QUANTITY = 99;

/**
 * Accessories. Both come from the brief's component list; a windowsill under a
 * door is not a thing anyone orders, so it is offered on windows only.
 */
export const accessories: { key: AccessoryKey; constructions: ConstructionKind[] }[] = [
  { key: "windowsill", constructions: ["window"] },
  { key: "mosquito-net", constructions: ["window", "door"] },
];

/** One position of a request. Several may be sent together. */
export interface ConfiguredItem {
  id: string;
  construction: ConstructionKind;
  /** Product slug from `data/products.ts`. */
  system: string;
  /** One entry per sash, in left-to-right order. Windows only. */
  sashes: OpeningType[];
  /** Doors only. */
  doorLayout: DoorLayout;
  widthMm: number;
  heightMm: number;
  glazing: GlazingKey;
  color: string;
  accessories: AccessoryKey[];
  quantity: number;
}

/** The category slug that makes a system available as this construction. */
const categoryOf: Record<ConstructionKind, string> = {
  window: "windows",
  door: "doors",
};

export function systemsFor(construction: ConstructionKind): ProductBase[] {
  return productsByCategory(categoryOf[construction]);
}

export function findSystem(slug: string): ProductBase | undefined {
  return products.find((product) => product.slug === slug);
}

export function optionsOf(slug: string): SystemOptions {
  const options = systemOptions[slug];
  if (!options) {
    // A system without an entry is a data bug, not a runtime state to paper
    // over: the calculator would silently offer it with no glazing at all.
    throw new Error(`No calculator options declared for system "${slug}"`);
  }
  return options;
}

export function colorsOf(slug: string): string[] {
  return findSystem(slug)?.colors ?? [];
}

export function accessoriesFor(construction: ConstructionKind): AccessoryKey[] {
  return accessories
    .filter((accessory) => accessory.constructions.includes(construction))
    .map((accessory) => accessory.key);
}

let itemCounter = 0;

export function createItem(construction: ConstructionKind = "window"): ConfiguredItem {
  const available = systemsFor(construction);
  // Open on a system the client calls popular rather than on the first rung of
  // the ladder: ЭКОЛАЙН comes first in catalog order and ships in white only,
  // so it would greet every visitor with a palette of one and a single glazing
  // option — the cascade at its least legible.
  const system = available.find((product) => product.popular) ?? available[0];
  const options = optionsOf(system.slug);
  const limits = sizeLimits[construction];
  itemCounter += 1;

  return {
    id: `item-${itemCounter}`,
    construction,
    system: system.slug,
    sashes: [construction === "window" ? "tilt-turn" : "casement"],
    doorLayout: "single",
    widthMm: limits.width.default,
    heightMm: limits.height.default,
    glazing: options.glazing[0],
    color: colorsOf(system.slug)[0],
    accessories: [],
    quantity: 1,
  };
}

/**
 * Re-applies the cascade after a change.
 *
 * Every edit goes through here rather than through per-field guards, because
 * the invalid states all arise the same way: a choice that was legal under the
 * previous system survives into the next one. Switching from STELLA to
 * ЭКОЛАЙН has to drop anthracite and the energy-saving unit in the same move,
 * and switching a window to a door has to drop the third sash.
 */
export function reconcile(item: ConfiguredItem): ConfiguredItem {
  const available = systemsFor(item.construction);
  const system = available.some((product) => product.slug === item.system)
    ? item.system
    : available[0].slug;

  const options = optionsOf(system);
  const colors = colorsOf(system);
  const limits = sizeLimits[item.construction];
  const allowedAccessories = accessoriesFor(item.construction);

  const sashes = (item.construction === "window" ? item.sashes : item.sashes.slice(0, 1))
    .slice(0, MAX_SASHES)
    .map((opening) => (options.openings.includes(opening) ? opening : options.openings[0]));

  return {
    ...item,
    system,
    sashes: sashes.length > 0 ? sashes : [options.openings[0]],
    glazing: options.glazing.includes(item.glazing) ? item.glazing : options.glazing[0],
    color: colors.includes(item.color) ? item.color : colors[0],
    widthMm: clamp(item.widthMm, limits.width),
    heightMm: clamp(item.heightMm, limits.height),
    accessories: item.accessories.filter((key) => allowedAccessories.includes(key)),
    quantity: Math.min(Math.max(Math.round(item.quantity) || 1, 1), MAX_QUANTITY),
  };
}

export function clamp(value: number, range: Range): number {
  if (!Number.isFinite(value)) return range.default;
  return Math.min(Math.max(Math.round(value), range.min), range.max);
}
