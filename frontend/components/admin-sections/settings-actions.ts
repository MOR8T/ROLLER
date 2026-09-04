"use server";

import { cookies } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";
import { describeError } from "@/components/admin-sections/utils/describe-error";

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

/** Same helper as `contact-info-actions.ts` — see its comment for why it exists. */
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

  return { success: true, data: (await res.json().catch(() => undefined)) as T };
}

export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const newPasswordConfirm = String(formData.get("new_password_confirm") ?? "");

  if (!currentPassword || !newPassword) {
    return { success: false, error: "Заполните оба поля" };
  }
  if (newPassword !== newPasswordConfirm) {
    return { success: false, error: "Пароли не совпадают" };
  }
  if (newPassword.length < 8) {
    return { success: false, error: "Новый пароль должен быть не короче 8 символов" };
  }

  return adminRequest("/api/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
}

/**
 * «Сайт в разработке» — the switch that replaces the whole public site with
 * `MaintenanceScreen`, plus the code that lets a chosen visitor back through
 * it. See `lib/site-settings.ts` for the read path the site itself uses, and
 * `lib/maintenance-access.ts` for what the code does once it is accepted.
 */
export interface AdminSiteSettingsDto {
  maintenanceMode: boolean;
  /** `null` → no code set, and the placeholder has nothing to unlock. */
  previewCode: string | null;
}

/**
 * Reads `/admin`, not the public `/api/site-settings`: the code is the one
 * field the public response deliberately withholds, and this page has to show
 * the admin the code they are handing out.
 */
export async function getAdminSiteSettings(): Promise<AdminSiteSettingsDto | null> {
  const result = await adminRequest<{ maintenance_mode: boolean; preview_code: string | null }>(
    "/api/site-settings/admin",
    { cache: "no-store" },
  );
  return result.success
    ? {
        maintenanceMode: result.data.maintenance_mode === true,
        previewCode: result.data.preview_code || null,
      }
    : null;
}

export async function updateMaintenanceModeAction(enabled: boolean): Promise<ActionResult> {
  const result = await adminRequest("/api/site-settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maintenance_mode: enabled }),
  });

  if (result.success) {
    revalidatePath("/admin/settings");
    // Every public page reads this tag through `app/[locale]/layout.tsx`, so
    // this is what makes the switch take effect at once rather than at the end
    // of that fetch's 60s window. "max" is the stale-while-revalidate profile
    // the rest of this project uses — see `contact-info-actions.ts`.
    revalidateTag("site-settings", "max");
  }

  return result;
}

/**
 * Saves or clears the preview code.
 *
 * No `revalidateTag("site-settings")` for the *code* itself — the site never
 * caches it; `lib/maintenance-access.ts` re-checks the cookie against the
 * backend on every render, so a changed code takes effect on the next
 * request without anything being invalidated. The tag is still revalidated
 * because the public payload carries `preview_access_enabled`, which decides
 * whether the placeholder's plate is a button at all.
 */
export async function updatePreviewCodeAction(code: string): Promise<ActionResult> {
  const trimmed = code.trim();
  if (trimmed && trimmed.length < 4) {
    return { success: false, error: "Код должен быть не короче 4 символов" };
  }
  if (trimmed.length > 64) {
    return { success: false, error: "Код должен быть не длиннее 64 символов" };
  }

  const result = await adminRequest("/api/site-settings/preview-code", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preview_code: trimmed || null }),
  });

  if (result.success) {
    revalidatePath("/admin/settings");
    revalidateTag("site-settings", "max");
  }

  return result;
}
