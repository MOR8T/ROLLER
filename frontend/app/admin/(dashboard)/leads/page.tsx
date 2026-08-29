import { LeadsManager } from "@/components/admin/leads/leads-manager";
import { getAdminLeads } from "@/components/admin-sections/leads-actions";

export default async function AdminLeadsPage() {
  const leads = await getAdminLeads();

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Заявки</h1>
      <p className="mt-2 text-neutral-600">
        Все заявки с сайта — калькулятор, форма заявки и «Свяжитесь с нами». Заявка сохраняется
        здесь до того, как в WhatsApp открывается готовое сообщение, так что ни одна не теряется.
      </p>

      <LeadsManager initialLeads={leads} />
    </div>
  );
}
