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
 * `MaintenanceScreen`. Read and written as the one-field singleton it is; see
 * `lib/site-settings.ts` for the read path the site itself uses.
 */
export interface AdminSiteSettingsDto {
  maintenanceMode: boolean;
}

export async function getAdminSiteSettings(): Promise<AdminSiteSettingsDto | null> {
  const result = await adminRequest<{ maintenance_mode: boolean }>("/api/site-settings", {
    cache: "no-store",
  });
  return result.success ? { maintenanceMode: result.data.maintenance_mode === true } : null;
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
