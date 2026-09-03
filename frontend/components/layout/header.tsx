"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, Phone, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Link } from "@/i18n/navigation";
import type { ProductsMenuCategory } from "@/lib/product-links";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { HeaderDesktopNav } from "./header-desktop-nav";
import { HeaderProductsMenu } from "./header-products-menu";
import { HeaderMobileDrawer } from "./header-mobile-drawer";

const PRODUCTS_CLOSE_DELAY_MS = 140;

// Distance the page must scroll before the header switches from the
// transparent "over hero" state to the solid state, in px.
const SCROLL_THRESHOLD = 24;

// Below this offset the bar never auto-hides: near the top of the page the
// header is part of the first screen, and hiding it there reads as a glitch.
const HIDE_AFTER = 120;

// Scroll movements smaller than this are ignored, so momentum jitter and
// rubber-banding on iOS can't flip the bar back and forth.
const SCROLL_DELTA = 6;

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
 * would render white text on a near-white background. What scroll changes now
 * is elevation — a shadow appears once the page moves under the bar — and
 * visibility: past `HIDE_AFTER` the bar slides out of the way while the visitor
 * reads downwards and slides back on the first upward scroll, so a long product
 * page keeps its full viewport without the visitor having to return to the top
 * to navigate.
 *
 * This component owns only the bar and the open/closed state; the mega-menu and
 * the mobile drawer live in their own files, each with its own behaviour.
 */
export function Header({
  productCategories,
}: {
  /**
   * The «Продукция» panel's contents, read from the backend by
   * `app/[locale]/layout.tsx` and passed straight through to the two menus.
   * The header is a client component and cannot fetch it itself.
   */
  productCategories: ProductsMenuCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  const t = useTranslations("header");
  const tCommon = useTranslations("common");

  const productsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);

  const openProducts = useCallback(() => {
    if (productsCloseTimer.current) {
      clearTimeout(productsCloseTimer.current);
      productsCloseTimer.current = null;
    }
    setProductsOpen(true);
  }, []);

  const scheduleCloseProducts = useCallback(() => {
    if (productsCloseTimer.current) clearTimeout(productsCloseTimer.current);
    productsCloseTimer.current = setTimeout(() => {
      setProductsOpen(false);
      productsCloseTimer.current = null;
    }, PRODUCTS_CLOSE_DELAY_MS);
  }, []);

  const closeProducts = useCallback(() => setProductsOpen(false), []);

  // Stable identity: the drawer keys its scroll-lock and focus-trap effect on
  // this callback, so a new function per render would re-run the effect.
  const closeMobile = useCallback(() => setOpen(false), []);

  useEffect(() => {
    return () => {
      if (productsCloseTimer.current) clearTimeout(productsCloseTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!productsOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProductsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [productsOpen]);

  // Opened by click, the panel cannot rely on the pointer leaving it to close
  // again — a tap on the page has to do it.
  useEffect(() => {
    if (!productsOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setProductsOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [productsOpen]);

  // One listener drives both scroll-derived states: the elevation shadow and
  // the hide-on-scroll-down / reveal-on-scroll-up behaviour. Reads are batched
  // into a rAF so a fast scroll costs one layout read per frame, not one per
  // event.
  useEffect(() => {
    lastScrollY.current = Math.max(window.scrollY, 0);
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(window.scrollY, 0);
      setScrolled(y > SCROLL_THRESHOLD);

      const delta = y - lastScrollY.current;
      // Keep the previous reference point until the page actually moves, so a
      // slow drift still accumulates into a real direction.
      if (Math.abs(delta) < SCROLL_DELTA) return;

      setHidden(y > HIDE_AFTER && delta > 0);
      lastScrollY.current = y;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // An open menu keeps the elevation on regardless of scroll position, so the
  // bar stays visually detached from the panel it opened.
  const elevated = scrolled || open || productsOpen;

  // An open mega-menu or drawer pins the bar in place: sliding away the element
  // the visitor just opened (and, on desktop, the panel hanging off it) would
  // take the menu with it.
  const concealed = hidden && !open && !productsOpen;

  return (
    <header
      ref={headerRef}
      // Tabbing into a hidden bar has to bring it back, or the focus ring lands
      // off-screen.
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "sticky top-0 z-50 border-b border-brand-black/10 bg-surface/95 text-brand-black backdrop-blur",
        // `translate`, not `transform`: Tailwind v4 compiles `-translate-y-*`
        // to the standalone `translate` property, and a transition on
        // `transform` does not cover it — the bar would jump instead of slide.
        // `transform-gpu` (a bare `translateZ(0)`) still earns its place: it
        // promotes the blurred bar to its own compositor layer so the slide
        // doesn't re-rasterise the backdrop blur every frame.
        "transition-[translate,box-shadow] will-change-[translate] transform-gpu motion-reduce:transition-none",
        // Two different curves, because the two directions are not the same
        // gesture. Leaving is a long ease-in — the bar drifts off slowly at
        // first, so it never snaps out from under the pointer. Coming back is
        // an ease-out quint: fast off the mark, settling gently, which is what
        // makes the reveal feel instant without looking abrupt.
        concealed
          ? "duration-[320ms] ease-[cubic-bezier(0.32,0,0.28,1)]"
          : "duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
        elevated && "shadow-[0_8px_30px_-12px_rgba(29,29,27,0.18)]",
        // 110%, not 100%: the elevation shadow hangs ~18px below the bar and
        // would stay as a grey smudge along the top edge at exactly one height.
        concealed && "-translate-y-[110%]",
      )}
    >
      {/* `gap-4` at `xl`, not `gap-6`: seven nav items plus the logo and the
          phone block already run close to the edge at 1280px in Russian, and
          Tajik labels are 10–20% longer (DESIGN.md §10). */}
      <Container className="flex h-16 items-center justify-between gap-4 xl:h-20 2xl:gap-6">
        <Link
          href="/"
          aria-label={siteConfig.name}
          className="flex shrink-0 items-center gap-2 transition-colors"
        >
          <BrandLogo isDark className="h-8 w-auto xl:h-10" />
        </Link>

        <HeaderDesktopNav
          productsOpen={productsOpen}
          onProductsOpen={openProducts}
          onProductsScheduleClose={scheduleCloseProducts}
        />

        <div className="hidden shrink-0 items-center gap-3 xl:flex 2xl:gap-4">
          <LanguageSwitcher />

          <a
            href={siteConfig.phoneHref}
            className="inline-flex items-center gap-2 rounded-control py-2 text-brand-black transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Phone className="size-4 shrink-0" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold whitespace-nowrap">{siteConfig.phone}</span>
              <span className="text-[11px] font-medium tracking-wide uppercase">
                {tCommon("workingHours")}
              </span>
            </span>
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          className="grid size-10 place-items-center rounded-control text-brand-black transition-colors hover:bg-brand-black/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none xl:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

      <HeaderProductsMenu
        categories={productCategories}
        open={productsOpen}
        onOpen={openProducts}
        onScheduleClose={scheduleCloseProducts}
        onClose={closeProducts}
      />

      <HeaderMobileDrawer categories={productCategories} open={open} onClose={closeMobile} />
    </header>
  );
}
