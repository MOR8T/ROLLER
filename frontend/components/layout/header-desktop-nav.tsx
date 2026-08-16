"use client";

import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { navLinks } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { PRODUCTS_HREF } from "./header-shared";

interface HeaderDesktopNavProps {
  productsOpen: boolean;
  onProductsOpen: () => void;
  onProductsScheduleClose: () => void;
}

/**
 * Primary desktop navigation. The catalog item additionally drives the
 * mega-menu, which is rendered by the header itself so it can span the
 * full width below the bar.
 *
 * The gap tightens at `xl` and only opens up at `2xl`: the row now carries
 * eight items — «Профессионалам» joined it in stage 07 — and they already sit
 * close to the logo and the phone block at 1280px in Russian, while Tajik
 * labels run 10–20% longer (DESIGN.md §10). Shrinking the gutter is what keeps
 * the row on one line instead of pushing the phone off the bar.
 *
 * ⚠️ Eight is the ceiling for this layout. If the client keeps `/showroom`
 * (open question №7) the bar stays this tight; dropping it is what would give
 * the row air back.
 */
export function HeaderDesktopNav({
  productsOpen,
  onProductsOpen,
  onProductsScheduleClose,
}: HeaderDesktopNavProps) {
  const t = useTranslations("nav");
  const tHeader = useTranslations("header");

  return (
    <nav aria-label={tHeader("mainNav")} className="hidden min-w-0 items-center gap-7 xl:flex">
      {navLinks.map((link) => {
        if (link.href === PRODUCTS_HREF) {
          return (
            <div
              key={link.href}
              className="relative"
              onMouseEnter={onProductsOpen}
              onMouseLeave={onProductsScheduleClose}
            >
              <Link
                href={link.href}
                aria-expanded={productsOpen}
                aria-haspopup="true"
                aria-controls="products-mega-menu"
                onFocus={onProductsOpen}
                className={cn(
                  "group relative inline-flex items-center gap-1 py-2 text-sm font-medium text-brand-black/80 transition-colors hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                  productsOpen && "text-brand-red",
                )}
              >
                {t(link.key)}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    productsOpen && "rotate-180",
                  )}
                />
                <span
                  className={cn(
                    "absolute bottom-0.5 left-0 h-0.5 bg-brand-red transition-all duration-300",
                    productsOpen ? "w-full" : "w-0 group-hover:w-full",
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
            {t(link.key)}
            <span className="absolute bottom-0.5 left-0 h-0.5 w-0 bg-brand-red transition-all duration-300 group-hover:w-full" />
          </Link>
        );
      })}
    </nav>
  );
}
