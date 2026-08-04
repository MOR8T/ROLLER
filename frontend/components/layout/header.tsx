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
 * Two visual states, coordinated with the hero section:
 *  - "over hero" (page at top): transparent background, light text — sits over
 *    the dark hero. The hero is pulled up under the header via a negative
 *    margin so the transparent header actually overlays it.
 *  - "solid" (scrolled past threshold, or a menu open): white background,
 *    dark text, subtle bottom border + backdrop blur + elevation shadow.
 *
 * Note: the transparent state assumes the first section on the page is a dark
 * hero (true for the homepage). Other pages either start with a dark section or
 * will need to opt out — handled when those pages land.
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

  // Force the solid state while a menu is open so the bar stays legible
  // regardless of scroll position.
  const solid = scrolled || open || catalogOpen;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow,color] duration-300",
        solid
          ? "border-b border-brand-black/10 bg-brand-white/95 shadow-[0_8px_30px_-12px_rgba(29,29,27,0.18)] backdrop-blur"
          : "border-b border-transparent bg-transparent",
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
          solid={solid}
          catalogOpen={catalogOpen}
          onCatalogOpen={openCatalog}
          onCatalogScheduleClose={scheduleCloseCatalog}
        />

        <div className="hidden items-center gap-4 xl:flex">
          <LanguageSwitcher solid />

          <a
            href={siteConfig.phoneHref}
            className={cn(
              "inline-flex items-center gap-2 rounded-control py-2 transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
              solid ? "text-brand-black" : "text-brand-white",
            )}
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
          className={cn(
            "grid size-10 place-items-center rounded-control transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none xl:hidden",
            solid
              ? "text-brand-black hover:bg-brand-black/5"
              : "text-brand-white hover:bg-brand-white/10",
          )}
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
