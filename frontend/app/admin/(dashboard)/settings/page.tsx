import { MaintenanceManager } from "@/components/admin/settings/maintenance-manager";
import { PreviewCodeManager } from "@/components/admin/settings/preview-code-manager";
import { PasswordChangeManager } from "@/components/admin/settings/password-change-manager";
import { getAdminSiteSettings } from "@/components/admin-sections/settings-actions";

export default async function AdminSettingsPage() {
  const siteSettings = await getAdminSiteSettings();

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Настройки сайта</h1>
      <p className="mt-2 text-neutral-600">
        Режим разработки, код доступа к закрытому сайту и учётные данные для входа в админ-панель.
      </p>

      <MaintenanceManager initialEnabled={siteSettings?.maintenanceMode ?? null} />
      <PreviewCodeManager initialCode={siteSettings?.previewCode ?? null} />
      <PasswordChangeManager />
    </div>
  );
}
