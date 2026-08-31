import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/admin-auth";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser();
  if (!user) redirect("/login");

  return <AdminShell user={user}>{children}</AdminShell>;
}
