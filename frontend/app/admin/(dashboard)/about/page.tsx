import { PartnersManager } from "@/components/admin/partners/partners-manager";
import { getAdminPartners } from "@/app/admin/(dashboard)/partners-actions";

export default async function AdminAboutPage() {
  const partners = await getAdminPartners();

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">О компании</h1>
      <p className="mt-2 text-neutral-600">Раздел в разработке.</p>

      <PartnersManager initialPartners={partners} />
    </div>
  );
}
