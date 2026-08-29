"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";

export interface Label {
  ru: string;
  tj: string;
  en: string;
  tr: string;
}

export type GlazingKey =
  "single-glass" | "single-chamber" | "double-chamber" | "double-chamber-energy";

export interface Series {
  key: string;
  label: Label;
  material: "pvc" | "aluminium";
  constructions: ("window" | "door")[];
  glazing: GlazingKey[];
}

export interface Mechanism {
  key: string;
  label: Label;
}

export interface Accessory {
  key: string;
  label: Label;
  constructions: ("window" | "door")[];
}

export interface LaminationColor {
  key: string;
  label: Label;
  hex: string;
  /**
   * The lamination photograph tiled across the profile in the calculator's
   * scene — an admin upload (`/uploads/calculator/…`) or one of the five the
   * site shipped with (`/cal/textures/<key>.png`). Null means no photograph:
   * the swatch and the scene fall back to `hex`.
   *
   * This is the value that is stored; `textureSrc` is the same image as a URL
   * the browser can actually reach, which in dev is a different host.
   */
  texture: string | null;
  /** Display-only — never sent back. See `texture`. */
  textureSrc: string | null;
}

/**
 * An admin upload lives on the backend, which in dev is a different origin
 * from the admin panel; the shipped `/cal/…` textures are Next.js's own
 * static files. Same pattern as `hero-slides-actions.ts`.
 */
function textureSrcOf(texture: string | null): string | null {
  if (!texture) return null;
  return texture.startsWith("/uploads/")
    ? `${process.env.BACKEND_PUBLIC_URL ?? BACKEND_API_URL}${texture}`
    : texture;
}

export interface Range {
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface CalculatorSettingsDto {
  series: Series[];
  mechanisms: Mechanism[];
  accessories: Accessory[];
  laminationColors: LaminationColor[];
  sizeLimits: {
    window: { width: Range; height: Range };
    door: { width: Range; height: Range };
  };
}

interface RawCalculatorSettings {
  series: Series[];
  mechanisms: Mechanism[];
  accessories: Accessory[];
  lamination_colors: Omit<LaminationColor, "textureSrc">[];
  size_limits: CalculatorSettingsDto["sizeLimits"];
}

function toDto(raw: RawCalculatorSettings): CalculatorSettingsDto {
  return {
    series: raw.series,
    mechanisms: raw.mechanisms,
    accessories: raw.accessories,
    laminationColors: raw.lamination_colors.map((color) => ({
      ...color,
      // Tolerates a row seeded before `texture` existed, where the key is
      // simply absent rather than null.
      texture: color.texture ?? null,
      textureSrc: textureSrcOf(color.texture ?? null),
    })),
    sizeLimits: raw.size_limits,
  };
}

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/** Same helper as `contact-interests-actions.ts` — see its comment for why it exists. */
async function adminRequest<T = undefined>(
  path: string,
  init: RequestInit = {},
): Promise<ActionResult<T>> {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return { success: false, error: "Сессия истекла — войдите заново" };

  let res: Response;
  try {
    res = await fetch(`${BACKEND_API_URL}${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  } catch {
    return { success: false, error: "Не удалось связаться с сервером" };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { success: false, error: describeError(body) };
  }

  return { success: true, data: (await res.json()) as T };
}

export async function getAdminCalculatorSettings(): Promise<CalculatorSettingsDto | null> {
  const result = await adminRequest<RawCalculatorSettings>("/api/calculator-settings", {
    cache: "no-store",
  });
  if (!result.success) return null;
  return toDto(result.data);
}

export async function updateCalculatorSettingsAction(
  settings: CalculatorSettingsDto,
): Promise<ActionResult<CalculatorSettingsDto>> {
  const result = await adminRequest<RawCalculatorSettings>("/api/calculator-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      series: settings.series,
      mechanisms: settings.mechanisms,
      accessories: settings.accessories,
      // `textureSrc` is a display URL derived from `texture` — sending it back
      // would store a host-qualified path that breaks the moment the backend
      // moves.
      lamination_colors: settings.laminationColors.map((color) => ({
        key: color.key,
        label: color.label,
        hex: color.hex,
        texture: color.texture,
      })),
      size_limits: settings.sizeLimits,
    }),
  });
  if (!result.success) return result;

  revalidatePath("/admin/calculator");
  return { success: true, data: toDto(result.data) };
}

/**
 * Uploads one lamination photograph and returns the path to store in that
 * colour's `texture`.
 *
 * Separate from the save above because the settings travel as one JSON body —
 * a multipart upload cannot ride along in it. Uploading does not save the
 * palette: the admin still presses «Сохранить», which is what makes an
 * abandoned upload harmless.
 */
export async function uploadLaminationTextureAction(
  formData: FormData,
): Promise<ActionResult<{ path: string; src: string }>> {
  const result = await adminRequest<{ path: string }>("/api/calculator-settings/texture", {
    method: "POST",
    body: formData,
  });
  if (!result.success) return result;

  // `src` is computed here rather than in the browser: only server code reads
  // `BACKEND_PUBLIC_URL`, and the client has no way to know the upload lives
  // on a different host in dev.
  return {
    success: true,
    data: { path: result.data.path, src: textureSrcOf(result.data.path) as string },
  };
}
