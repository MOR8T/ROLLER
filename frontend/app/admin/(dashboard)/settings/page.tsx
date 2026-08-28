import { PasswordChangeManager } from "@/components/admin/settings/password-change-manager";

export default function AdminSettingsPage() {
  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Настройки сайта</h1>
      <p className="mt-2 text-neutral-600">Учётные данные для входа в админ-панель.</p>

      <PasswordChangeManager />
    </div>
  );
}
