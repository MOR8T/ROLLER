import { ShowroomsManager } from "@/components/admin/showrooms/showrooms-manager";
import { getAdminShowrooms } from "@/components/admin-sections/showrooms-actions";

export default async function AdminShowroomsPage() {
  const showrooms = await getAdminShowrooms();

  return (
    <div className="px-gutter py-10">
      <h1 className="text-2xl font-semibold text-brand-black">Шоурумы</h1>

      <ShowroomsManager initialShowrooms={showrooms} />
    </div>
  );
}
