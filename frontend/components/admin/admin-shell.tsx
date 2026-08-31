"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/admin/sidebar";
import { LogoutButton } from "@/components/admin/logout-button";
import { ToastProvider } from "@/components/ui/toast";
import type { AdminUser } from "@/lib/admin-auth";

interface AdminShellProps {
  user: AdminUser;
  children: React.ReactNode;
}

export function AdminShell({ user, children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-full bg-brand-white">
        <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

        <div className="flex min-h-full flex-col lg:pl-64">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-brand-black/10 bg-brand-white px-5">
            <button
              type="button"
              aria-label="Открыть меню"
              onClick={() => setMobileNavOpen(true)}
              className="grid size-9 place-items-center rounded-control text-brand-black transition-colors hover:bg-brand-black/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <p className="ml-auto text-sm text-neutral-500">
              Вы вошли как <span className="font-medium text-brand-black">{user.username}</span>
            </p>
            <LogoutButton />
          </header>

          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
