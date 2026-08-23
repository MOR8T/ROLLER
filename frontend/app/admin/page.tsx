import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { LogoutButton } from "@/components/admin/logout-button";

export default async function AdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-gutter py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-black">Панель управления</h1>
          <p className="text-sm text-neutral-500">Вы вошли как {user.username}</p>
        </div>
        <LogoutButton />
      </header>

      <p className="text-neutral-600">
        Это первая версия админ-панели — пока здесь только защищённый вход.
      </p>
    </div>
  );
}
