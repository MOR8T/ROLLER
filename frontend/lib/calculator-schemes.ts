import type { CalculatorOptions, GlazingKey } from "@/data/calculator";
import { BACKEND_API_URL } from "@/lib/admin-session";
import type { ConstructionKind, SchemeGeometry, SchemeNode } from "@/lib/scheme-geometry";

/**
 * The sole read path for the calculator's schemes and option lists.
 *
 * The same rule `lib/news.ts` and `lib/products.ts` follow: nothing else may
 * call `/api/calculator-*`. Components take the DTOs below as props, and the
 * page is what fetches.
 *
 * `data/calculator.ts` still owns the profile series and the glazing ladder —
 * those describe what a given product can be built as, so they belong to the
 * product rather than to a settings table. Everything an admin maintains as a
 * free-standing list comes from here.
 */

interface RawScheme {
  id: number;
  key: string;
  kind: ConstructionKind;
  columns: number;
  arch: number | null;
  geometry: SchemeNode;
  default_width_mm: number;
  default_height_mm: number;
  enabled: boolean;
  position: number;
}

/**
 * Every scheme the calculator may offer, in the admin's order.
 *
 * Returns an empty list — never a fabricated one — when the backend is
 * unreachable, and the page renders its "нет схем" state rather than
 * inventing a window. The endpoint already filters out disabled schemes, so
 * nothing here has to.
 */
export async function getCalculatorSchemes(): Promise<SchemeGeometry[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/calculator-schemes`, {
      next: { revalidate: 60, tags: ["calculator-schemes"] },
    });
    if (!res.ok) return [];

    const rows = (await res.json()) as RawScheme[];
    return rows.map((row) => ({
      key: row.key,
      kind: row.kind,
      columns: row.columns,
      arch: row.arch,
      defaultWidthMm: row.default_width_mm,
      defaultHeightMm: row.default_height_mm,
      geometry: row.geometry,
    }));
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                    */
/* -------------------------------------------------------------------------- */

interface RawLocalizedLabel {
  ru: string;
  tj: string;
  en: string;
  tr: string;
}

interface RawRange {
  min: number;
  max: number;
  step: number;
  default: number;
}

interface RawCalculatorSettings {
  series: {
    key: string;
    label: RawLocalizedLabel;
    material: "pvc" | "aluminium";
    constructions: ConstructionKind[];
    glazing: GlazingKey[];
  }[];
  mechanisms: { key: string; label: RawLocalizedLabel }[];
  accessories: {
    key: string;
    label: RawLocalizedLabel;
    constructions: ConstructionKind[];
  }[];
  lamination_colors: {
    key: string;
    label: RawLocalizedLabel;
    hex: string;
    texture: string | null;
  }[];
  size_limits: Record<ConstructionKind, { width: RawRange; height: RawRange }>;
}

/**
 * A texture path needs nothing done to it — an admin upload (`/uploads/...`)
 * and a seeded file (`/cal/textures/white.png`) are both answered from this
 * app's own origin. Same rule as `lib/products.ts`'s image resolver; see
 * `next.config.ts`'s `/uploads` rewrite for why.
 */
function resolveTexture(path: string | null): string | null {
  return path ?? null;
}

function labelOf(label: RawLocalizedLabel, locale: string): string {
  return (label as unknown as Record<string, string>)[locale] ?? label.ru;
}

/**
 * Every option list the admin maintains, resolved to one locale.
 *
 * Returns null on failure rather than a half-built bundle: the calculator
 * cannot offer a mechanism select with nothing in it or a slider with no
 * range, so the page renders its "недоступен" state instead. That is also why
 * the lists are not defaulted here — a silent fallback to values the admin
 * cannot see would be worse than an honest outage.
 */
export async function getCalculatorOptions(locale: string): Promise<CalculatorOptions | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/calculator-settings`, {
      next: { revalidate: 60, tags: ["calculator-settings"] },
    });
    if (!res.ok) return null;

    const raw = (await res.json()) as RawCalculatorSettings;

    return {
      series: raw.series.map((item) => ({
        key: item.key,
        label: labelOf(item.label, locale),
        material: item.material,
        constructions: item.constructions,
        glazing: item.glazing,
      })),
      mechanisms: raw.mechanisms.map((item) => ({
        key: item.key,
        label: labelOf(item.label, locale),
      })),
      accessories: raw.accessories.map((item) => ({
        key: item.key,
        label: labelOf(item.label, locale),
        constructions: item.constructions,
      })),
      laminations: raw.lamination_colors.map((colour) => ({
        key: colour.key,
        label: labelOf(colour.label, locale),
        hex: colour.hex,
        texture: resolveTexture(colour.texture),
      })),
      sizeLimits: raw.size_limits,
    };
  } catch {
    return null;
  }
}
