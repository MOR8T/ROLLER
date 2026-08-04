"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { navLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { CATALOG_HREF } from "./header-shared";

interface HeaderDesktopNavProps {
  catalogOpen: boolean;
  onCatalogOpen: () => void;
  onCatalogScheduleClose: () => void;
}

/**
 * Primary desktop navigation. The catalog item additionally drives the
 * mega-menu, which is rendered by the header itself so it can span the
 * full width below the bar.
 */
export function HeaderDesktopNav({
  catalogOpen,
  onCatalogOpen,
  onCatalogScheduleClose,
}: HeaderDesktopNavProps) {
  return (
    <nav aria-label="Основная навигация" className="hidden items-center gap-6 xl:flex">
      {navLinks.map((link) => {
        if (link.href === CATALOG_HREF) {
          return (
            <div
              key={link.href}
              className="relative"
              onMouseEnter={onCatalogOpen}
              onMouseLeave={onCatalogScheduleClose}
            >
              <Link
                href={link.href}
                aria-expanded={catalogOpen}
                aria-haspopup="true"
                aria-controls="catalog-mega-menu"
                onFocus={onCatalogOpen}
                className={cn(
                  "group relative inline-flex items-center gap-1 py-2 text-sm font-medium text-brand-black/80 transition-colors hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                  catalogOpen && "text-brand-red",
                )}
              >
                {link.label}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    catalogOpen && "rotate-180",
                  )}
                />
                <span
                  className={cn(
                    "absolute bottom-0.5 left-0 h-0.5 bg-brand-red transition-all duration-300",
                    catalogOpen ? "w-full" : "w-0 group-hover:w-full",
                  )}
                />
              </Link>
            </div>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            className="group relative inline-flex items-center py-2 text-sm font-medium text-brand-black/80 transition-colors hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {link.label}
            <span className="absolute bottom-0.5 left-0 h-0.5 w-0 bg-brand-red transition-all duration-300 group-hover:w-full" />
          </Link>
        );
      })}
    </nav>
  );
}
