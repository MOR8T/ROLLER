"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Calculator,
  Home,
  Inbox,
  LayoutGrid,
  Newspaper,
  PanelBottom,
  Package,
  Phone,
  Settings,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { adminNavItems, type AdminNavItem } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

const icons: Record<AdminNavItem["icon"], LucideIcon> = {
  home: Home,
  building: Building2,
  "layout-grid": LayoutGrid,
  package: Package,
  calculator: Calculator,
  newspaper: Newspaper,
  store: Store,
  phone: Phone,
  settings: Settings,
  "panel-bottom": PanelBottom,
  inbox: Inbox,
};

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

/**
 * Fixed on `lg+`, an off-canvas drawer below that — one nav list rendered
 * once, shown via `translate-x` rather than duplicated markup.
 */
export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onMobileClose}
        className={cn(
          "fixed inset-0 z-30 bg-brand-black/60 transition-opacity duration-300 lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        role="dialog"
        aria-modal={mobileOpen}
        aria-label="Меню админ-панели"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-black transition-transform duration-300 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-brand-white/10 px-5">
          <BrandLogo className="h-7! w-auto!" />
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={onMobileClose}
            className="grid size-9 place-items-center rounded-control text-brand-white transition-colors hover:bg-brand-white/10 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          {adminNavItems.map((item) => {
            const Icon = icons[item.icon];
            const active = isActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none",
                  active
                    ? "bg-brand-red/10 text-brand-red"
                    : "text-brand-white/70 hover:bg-brand-white/5 hover:text-brand-white",
                )}
              >
                <span
                  className={cn(
                    "absolute inset-y-1 left-0 w-0.5 rounded-full bg-brand-red transition-opacity",
                    active ? "opacity-100" : "opacity-0",
                  )}
                />
                <Icon className="size-[18px] shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
