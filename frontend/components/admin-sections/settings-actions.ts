"use server";

import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, BACKEND_API_URL } from "@/lib/admin-auth";

type ActionResult = { success: true } | { success: false; error: string };

/** Same helper as `contact-info-actions.ts` — see its comment for why it exists. */
async function adminRequest(path: string, init: RequestInit = {}): Promise<ActionResult> {
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
    return { success: false, error: body?.detail ?? "Не удалось выполнить запрос" };
  }

  return { success: true };
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
