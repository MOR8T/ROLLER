"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { navLinks, siteConfig } from "@/lib/site-config";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";

// Distance the page must scroll before the header switches from the
// transparent "over hero" state to the solid state, in px.
const SCROLL_THRESHOLD = 24;

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/**
 * Header
 *
 * Single bar layout, IMZO/AKFA-inspired:
 *  - left: logo
 *  - center (desktop): primary nav
 *  - right (desktop): language switcher + phone (with working hours) + WhatsApp CTA
 *  - right (mobile): burger -> full-height right-side drawer (animated, portaled)
 *
 * Two visual states, coordinated with the hero section:
 *  - "over hero" (page at top): transparent background, light text — sits over
 *    the dark hero. The hero is pulled up under the header via a negative
 *    margin so the transparent header actually overlays it.
 *  - "solid" (scrolled past threshold, or mobile menu open): white background,
 *    dark text, subtle bottom border + backdrop blur + elevation shadow.
 *
 * Note: the transparent state assumes the first section on the page is a dark
 * hero (true for the homepage). Other pages either start with a dark section or
 * will need to opt out — handled when those pages land.
 */
export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isClient = useIsClient();
  const prefersReducedMotion = useReducedMotion();

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open, close on Escape, and
  // trap focus inside the dialog so keyboard users can't tab out to the page
  // behind the backdrop.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus to the close button on open.
    const closeButton = drawer?.querySelector<HTMLElement>('button[aria-label="Закрыть меню"]');
    const focusables = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (closeButton ?? focusables?.[0])?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !drawer || !focusables?.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // Force the solid state while the mobile menu is open so the bar stays
  // legible regardless of scroll position.
  const solid = scrolled || open;

  const drawerVariants: Variants = prefersReducedMotion
    ? { hidden: { x: 0, opacity: 0 }, visible: { x: 0, opacity: 1 }, exit: { x: 0, opacity: 0 } }
    : {
        hidden: { x: "100%" },
        visible: { x: 0, transition: { type: "spring", stiffness: 320, damping: 34 } },
        exit: { x: "100%", transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const } },
      };

  const backdropVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const itemVariants: Variants = prefersReducedMotion
    ? { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const },
        },
      };

  const mobileMenu =
    isClient &&
    createPortal(
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              aria-hidden
              onClick={() => setOpen(false)}
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 z-60 bg-brand-black/55 xl:hidden"
            />
            <motion.aside
              key="drawer"
              ref={drawerRef}
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Мобильное меню"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-y-0 right-0 z-70 flex w-full max-w-sm flex-col bg-brand-white shadow-2xl xl:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-brand-black/10 px-5">
                <Link
                  href="/"
                  aria-label={siteConfig.name}
                  onClick={() => setOpen(false)}
                  className="flex items-center"
                >
                  <BrandLogo isDark className="h-8 w-auto" />
                </Link>
                <button
                  type="button"
                  aria-label="Закрыть меню"
                  onClick={() => setOpen(false)}
                  className="grid size-10 place-items-center rounded-md text-brand-black transition-colors hover:bg-brand-black/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <X className="size-6" />
                </button>
              </div>

              <motion.nav
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
                }}
              >
                {navLinks.map((link) => (
                  <motion.div key={link.href} variants={itemVariants}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-3 text-base font-medium text-brand-black/80 transition-colors hover:bg-brand-black/5 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div variants={itemVariants} className="mt-4 px-3">
                  <LanguageSwitcher solid />
                </motion.div>
              </motion.nav>

              <motion.div
                className="shrink-0 space-y-3 border-t border-brand-black/10 px-5 py-5"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } },
                }}
              >
                <motion.a
                  variants={itemVariants}
                  href={siteConfig.phoneHref}
                  className="flex items-center gap-3 rounded-md py-1 text-base font-semibold text-brand-black transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <Phone className="size-5 shrink-0" />
                  <span className="flex flex-col leading-tight">
                    <span>{siteConfig.phone}</span>
                    {/* <span className="text-[11px] font-medium tracking-wide text-brand-black/55 uppercase">
                      {siteConfig.workingHours}
                    </span> */}
                  </span>
                </motion.a>

                <motion.div variants={itemVariants}>
                  <ButtonLink
                    href={siteConfig.whatsappHref}
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    <MessageCircle className="size-4" />
                    Написать в WhatsApp
                  </ButtonLink>
                </motion.div>
              </motion.div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>,
      document.body,
    );

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
          <BrandLogo isDark={solid} className="h-8 w-auto xl:h-10" />
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-6 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative inline-flex items-center py-2 text-sm font-medium transition-colors hover:text-brand-red focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                solid ? "text-brand-black/80" : "text-brand-white/85",
              )}
            >
              {link.label}
              <span
                className={cn(
                  "absolute bottom-0.5 left-0 h-0.5 w-0 bg-brand-red transition-all duration-300 group-hover:w-full",
                  solid ? "" : "bg-brand-white",
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 xl:flex">
          <LanguageSwitcher solid={solid} />

          <a
            href={siteConfig.phoneHref}
            className={cn(
              "inline-flex items-center gap-2 rounded-md py-2 transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
              solid ? "text-brand-black" : "text-brand-white",
            )}
          >
            <Phone className="size-4" />
            <span className="text-sm font-semibold">{siteConfig.phone}</span>
          </a>
          <ButtonLink href={siteConfig.whatsappHref} size="sm" className="rounded-full">
            <MessageCircle className="size-4" />
            WhatsApp
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label={open ? "Закрыть меню" : "Меню"}
          aria-expanded={open}
          aria-controls="mobile-drawer"
          className={cn(
            "grid size-10 place-items-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none xl:hidden",
            solid
              ? "text-brand-black hover:bg-brand-black/5"
              : "text-brand-white hover:bg-brand-white/10",
          )}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

      {mobileMenu}
    </header>
  );
}
