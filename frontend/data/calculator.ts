import type { SchemeGeometry } from "@/lib/scheme-geometry";

/**
 * The calculator's option lists and the geometry behind its preview
 * (`project_plan/06-*.md`).
 *
 * The page is modelled on `imzo.uz/calculator`: a construction is picked from
 * drawn variants, sized with two sliders, finished in «Детали расчёта» and
 * sent as a request. Nothing here is a price — the brief forbids showing one
 * (§5.3) and none of these parameters could produce one.
 *
 * ── Where the option lists live ───────────────────────────────────────────
 *
 * Open question №1 is settled: the lists an admin maintains — mechanisms,
 * accessories, the lamination palette, the size limits — are rows in Postgres
 * now, edited at `/admin/calculator` and fetched by the page. They arrive here
 * as a `CalculatorOptions` bundle rather than being imported, which is why
 * `createItem`, `reconcile` and `accessoriesFor` all take one.
 *
 * What is still code, and deliberately: `materials`, `GlazingKey`,
 * `systemOptions` and `systemsFor`. Those are not free-standing lists — they
 * describe what a given *profile system* can be built as, so their natural
 * home is the product, not a settings table. Moving them means adding a
 * calculator block to `Product`, which is its own change.
 */

export type ConstructionKind = "window" | "door";
export type MaterialKind = "pvc" | "aluminium";

export type GlazingKey =
  "single-glass" | "single-chamber" | "double-chamber" | "double-chamber-energy";

/** Per pane, read off the red indicator lines in the source drawings. */
export type OpeningType = "fixed" | "casement" | "tilt" | "tilt-turn";

export const constructionKinds: ConstructionKind[] = ["window", "door"];
export const materials: MaterialKind[] = ["pvc", "aluminium"];

/* -------------------------------------------------------------------------- */
/* Admin-managed option lists                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The lists an admin maintains at `/admin/calculator`, already resolved to the
 * visitor's locale by `lib/calculator-schemes.ts`.
 *
 * Keys are plain strings, not unions: they are rows in a table, so a union
 * would be a lie the moment somebody adds a mechanism. Whatever validity these
 * values have is checked against this bundle at the point of use, not by the
 * type system.
 */
export interface SeriesOption {
  key: string;
  label: string;
  material: MaterialKind;
  /** Which constructions this series can be built as. */
  constructions: ConstructionKind[];
  /** The glazing units it sells with, in the admin's order. */
  glazing: GlazingKey[];
}

export interface MechanismOption {
  key: string;
  label: string;
}

export interface AccessoryOption {
  key: string;
  label: string;
  /** Which constructions offer it — a windowsill is not a door fitting. */
  constructions: ConstructionKind[];
}

export interface LaminationOption {
  key: string;
  label: string;
  hex: string;
  /** Browser-reachable URL, or null when the colour has no photograph. */
  texture: string | null;
}

export interface CalculatorOptions {
  series: SeriesOption[];
  mechanisms: MechanismOption[];
  accessories: AccessoryOption[];
  /**
   * One palette for both lamination and hardware: the client confirmed on
   * 2026-08-23 that handles ship in the lamination colours rather than in a
   * palette of their own.
   */
  laminations: LaminationOption[];
  sizeLimits: Record<ConstructionKind, { width: Range; height: Range }>;
}

export interface Range {
  min: number;
  max: number;
  step: number;
  default: number;
}

export const MAX_ITEMS = 8;
export const MAX_QUANTITY = 99;

/* -------------------------------------------------------------------------- */
/* Variants                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The variants a construction offers, grouped the way `imzo.uz` groups them —
 * by how many sashes wide they read, with everything else (a transom, an
 * arched head, a fanlight divided more finely than the sashes under it)
 * sitting as a variation inside its group.
 *
 * ⚠️ The schemes are a *parameter* now, not a module-level constant read from
 * `data/calculator-schemes.json`. They live in the backend and an admin edits
 * them (`/admin/calculator`), so the page fetches them and hands them down —
 * `lib/calculator-schemes.ts` is the read path. The JSON file survives only as
 * the converter's input; nothing renders from it.
 */
export interface VariantGroup {
  columns: number;
  variants: SchemeGeometry[];
}

export function findScheme(schemes: SchemeGeometry[], key: string): SchemeGeometry | undefined {
  return schemes.find((scheme) => scheme.key === key);
}

export function variantGroups(
  schemes: SchemeGeometry[],
  construction: ConstructionKind,
): VariantGroup[] {
  const groups = new Map<number, SchemeGeometry[]>();
  for (const scheme of schemes) {
    if (scheme.kind !== construction) continue;
    const bucket = groups.get(scheme.columns);
    if (bucket) bucket.push(scheme);
    else groups.set(scheme.columns, [scheme]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([columns, variants]) => ({ columns, variants }));
}

/** The first variant of the smallest group, or "" when there are no schemes. */
function firstVariant(schemes: SchemeGeometry[], construction: ConstructionKind): string {
  return variantGroups(schemes, construction)[0]?.variants[0]?.key ?? "";
}

/**
 * The size a variant opens at, clamped to what the workshop will make.
 *
 * Clamped here rather than trusted: the defaults are admin-editable and the
 * limits are a separate list, so nothing stops the two from disagreeing.
 */
export function defaultSizeOf(
  scheme: SchemeGeometry | undefined,
  construction: ConstructionKind,
  options: CalculatorOptions,
): { widthMm: number; heightMm: number } {
  const limits = options.sizeLimits[construction];
  if (!scheme) {
    return { widthMm: limits.width.default, heightMm: limits.height.default };
  }
  return {
    widthMm: clamp(scheme.defaultWidthMm, limits.width),
    heightMm: clamp(scheme.defaultHeightMm, limits.height),
  };
}

/* -------------------------------------------------------------------------- */
/* Systems                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * The series on offer for a construction in a material.
 *
 * Reads the admin's list, not `data/products.ts`. The two are deliberately
 * separate: the catalogue publishes what marketing wants shown, while this is
 * what the sales desk will actually quote, and the client has changed one
 * without the other before. `material` stays an axis *here* only — the
 * catalogue dropped it on 2026-08-17 and this is imzo's «Тип профиля → Серия
 * профиля» pair, restored at the client's request on 2026-08-23.
 */
export function systemsFor(
  options: CalculatorOptions,
  construction: ConstructionKind,
  material: MaterialKind,
): SeriesOption[] {
  return options.series.filter(
    (series) => series.material === material && series.constructions.includes(construction),
  );
}

export function findSeries(options: CalculatorOptions, key: string): SeriesOption | undefined {
  return options.series.find((series) => series.key === key);
}

/**
 * What a series can be glazed with.
 *
 * An empty list for an unknown key rather than a throw: the series list is
 * admin-managed now, so a key that has been renamed under a visitor is an
 * ordinary event and `reconcile` handles it by picking another series.
 */
export function glazingOf(options: CalculatorOptions, key: string): GlazingKey[] {
  return findSeries(options, key)?.glazing ?? [];
}

/** The extras offered for a construction, in the admin's order. */
export function accessoriesFor(
  options: CalculatorOptions,
  construction: ConstructionKind,
): AccessoryOption[] {
  return options.accessories.filter((accessory) => accessory.constructions.includes(construction));
}

/* -------------------------------------------------------------------------- */
/* One position of a request                                                   */
/* -------------------------------------------------------------------------- */

export interface ConfiguredItem {
  id: string;
  construction: ConstructionKind;
  material: MaterialKind;
  /** Series key from the admin's list. */
  system: string;
  /** Scheme key from the backend — `win_8`, `door_3`. */
  variant: string;
  widthMm: number;
  heightMm: number;
  glazing: GlazingKey;
  /** A mechanism key from the admin's list. Plain string, same as the colours. */
  mechanism: string;
  /**
   * Lamination and hardware colour keys.
   *
   * Plain `string`, not `LaminationKey`: the palette is admin-managed now
   * (`/admin/calculator`) and its keys are rows in a table, so a compile-time
   * union would be a lie the moment somebody adds a colour. `ItemCard`
   * resolves a key against the fetched palette and falls back to its first
   * entry, which is what covers a colour being renamed or removed under a
   * visitor mid-session.
   */
  lamination: string;
  hardware: string;
  accessories: string[];
  quantity: number;
}

export function createItem(
  id: string,
  construction: ConstructionKind,
  schemes: SchemeGeometry[],
  options: CalculatorOptions,
): ConfiguredItem {
  const variant = firstVariant(schemes, construction);
  const size = defaultSizeOf(findScheme(schemes, variant), construction, options);

  return reconcile(
    {
      id,
      construction,
      material: "pvc",
      system: "",
      // Open on the simplest variant of the smallest group — a single sash reads
      // at a glance, and every other variant is one click from it.
      variant,
      widthMm: size.widthMm,
      heightMm: size.heightMm,
      glazing: "single-chamber",
      // The first entry of each admin list, not a hardcoded key: an admin who
      // renames «standard» must not leave every new position pointing at a
      // mechanism that no longer exists.
      mechanism: options.mechanisms[0]?.key ?? "",
      lamination: options.laminations[0]?.key ?? "",
      hardware: options.laminations[0]?.key ?? "",
      accessories: [],
      quantity: 1,
    },
    schemes,
    options,
  );
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
export function reconcile(
  item: ConfiguredItem,
  schemes: SchemeGeometry[],
  options: CalculatorOptions,
): ConfiguredItem {
  const available = systemsFor(options, item.construction, item.material);
  const material = available.length > 0 ? item.material : otherMaterial(item.material);
  const systems =
    available.length > 0 ? available : systemsFor(options, item.construction, material);
  // `systems` can still be empty — an admin may have left a construction with
  // no series at all — so this falls back to the key already held rather than
  // indexing into nothing.
  const system = systems.some((series) => series.key === item.system)
    ? item.system
    : (systems[0]?.key ?? item.system);

  const glazing = glazingOf(options, system);
  const limits = options.sizeLimits[item.construction];
  const allowed = accessoriesFor(options, item.construction).map((a) => a.key);
  // A variant that does not exist, or belongs to the other construction,
  // falls back to the first on offer — which is also what happens when an
  // admin disables the scheme a visitor had selected.
  const scheme = findScheme(schemes, item.variant);
  const keptVariant = Boolean(scheme && scheme.kind === item.construction);
  const variant = keptVariant ? scheme!.key : firstVariant(schemes, item.construction);

  // When *this function* substitutes the variant — a window switched to a
  // door, or a scheme the admin has since disabled — the size that came with
  // the old one is meaningless, so the new variant's own default replaces it.
  // A variant the visitor picked deliberately arrives with its size already in
  // the patch, so `keptVariant` is true and whatever they set is left alone.
  const size = keptVariant
    ? { widthMm: item.widthMm, heightMm: item.heightMm }
    : defaultSizeOf(findScheme(schemes, variant), item.construction, options);

  return {
    ...item,
    material,
    system,
    variant,
    glazing: glazing.includes(item.glazing) ? item.glazing : (glazing[0] ?? item.glazing),
    // Clamped against the admin's list, so a mechanism that has been renamed
    // or removed cannot survive into a submitted request.
    mechanism: options.mechanisms.some((m) => m.key === item.mechanism)
      ? item.mechanism
      : (options.mechanisms[0]?.key ?? ""),
    lamination: colourOrFirst(options, item.lamination),
    hardware: colourOrFirst(options, item.hardware),
    widthMm: clamp(size.widthMm, limits.width),
    heightMm: clamp(size.heightMm, limits.height),
    accessories: item.accessories.filter((key) => allowed.includes(key)),
    quantity: Math.min(Math.max(Math.round(item.quantity) || 1, 1), MAX_QUANTITY),
  };
}

function colourOrFirst(options: CalculatorOptions, key: string): string {
  return options.laminations.some((colour) => colour.key === key)
    ? key
    : (options.laminations[0]?.key ?? "");
}

function otherMaterial(material: MaterialKind): MaterialKind {
  return material === "pvc" ? "aluminium" : "pvc";
}

export function clamp(value: number, range: Range): number {
  if (!Number.isFinite(value)) return range.default;
  return Math.min(Math.max(Math.round(value), range.min), range.max);
}
