"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { BrandLogo } from "@/components/ui/brand-logo";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { HeaderDesktopNav } from "./header-desktop-nav";
import { HeaderCatalogMenu } from "./header-catalog-menu";
import { HeaderMobileDrawer } from "./header-mobile-drawer";

const CATALOG_CLOSE_DELAY_MS = 140;

// Distance the page must scroll before the header switches from the
// transparent "over hero" state to the solid state, in px.
const SCROLL_THRESHOLD = 24;

/**
 * Header
 *
 * Single bar layout:
 *  - left: logo
 *  - center (desktop): primary nav — `HeaderDesktopNav`
 *  - right (desktop): language switcher + phone with working hours
 *  - right (mobile): burger -> `HeaderMobileDrawer`
 *
 * The bar is always light. It used to go transparent with white text while the
 * page sat at the top, which only worked over a dark full-screen hero; now that
 * white dominates the site (DESIGN.md §3) and the hero is light, that state
 * would render white text on a near-white background. The only thing scroll
 * changes now is elevation: a shadow appears once the page moves under the bar.
 *
 * This component owns only the bar and the open/closed state; the mega-menu and
 * the mobile drawer live in their own files, each with its own behaviour.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const catalogCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openCatalog = useCallback(() => {
    if (catalogCloseTimer.current) {
      clearTimeout(catalogCloseTimer.current);
      catalogCloseTimer.current = null;
    }
    setCatalogOpen(true);
  }, []);

  const scheduleCloseCatalog = useCallback(() => {
    if (catalogCloseTimer.current) clearTimeout(catalogCloseTimer.current);
    catalogCloseTimer.current = setTimeout(() => {
      setCatalogOpen(false);
      catalogCloseTimer.current = null;
    }, CATALOG_CLOSE_DELAY_MS);
  }, []);

  const closeCatalog = useCallback(() => setCatalogOpen(false), []);

  // Stable identity: the drawer keys its scroll-lock and focus-trap effect on
  // this callback, so a new function per render would re-run the effect.
  const closeMobile = useCallback(() => setOpen(false), []);

  useEffect(() => {
    return () => {
      if (catalogCloseTimer.current) clearTimeout(catalogCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!catalogOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCatalogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catalogOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // An open menu keeps the elevation on regardless of scroll position, so the
  // bar stays visually detached from the panel it opened.
  const elevated = scrolled || open || catalogOpen;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-brand-black/10 bg-surface/95 text-brand-black backdrop-blur transition-shadow duration-300",
        elevated && "shadow-[0_8px_30px_-12px_rgba(29,29,27,0.18)]",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6 xl:h-20">
        <Link
          href="/"
          aria-label={siteConfig.name}
          className="flex shrink-0 items-center gap-2 transition-colors"
        >
          <BrandLogo isDark className="h-8 w-auto xl:h-10" />
        </Link>

        <HeaderDesktopNav
          catalogOpen={catalogOpen}
          onCatalogOpen={openCatalog}
          onCatalogScheduleClose={scheduleCloseCatalog}
        />

        <div className="hidden items-center gap-4 xl:flex">
          <LanguageSwitcher />

          <a
            href={siteConfig.phoneHref}
            className="inline-flex items-center gap-2 rounded-control py-2 text-brand-black transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Phone className="size-4" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{siteConfig.phone}</span>
              <span className="text-[11px] font-medium tracking-wide uppercase">
                {siteConfig.workingHours}
              </span>
            </span>
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Закрыть меню" : "Меню"}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          className="grid size-10 place-items-center rounded-control text-brand-black transition-colors hover:bg-brand-black/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none xl:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

      <HeaderCatalogMenu
        open={catalogOpen}
        onOpen={openCatalog}
        onScheduleClose={scheduleCloseCatalog}
        onClose={closeCatalog}
      />

      <HeaderMobileDrawer open={open} onClose={closeMobile} />
    </header>
  );
}
