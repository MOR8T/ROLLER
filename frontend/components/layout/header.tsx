"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { navLinks, siteConfig } from "@/lib/site-config";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";

// Distance the page must scroll before the header switches from the
// transparent "over hero" state to the solid state, in px.
const SCROLL_THRESHOLD = 24;

/**
 * Header
 *
 * Single bar layout, IMZO/AKFA-inspired:
 *  - left: logo
 *  - center (desktop): primary nav
 *  - right (desktop): language switcher + phone (with working hours) + WhatsApp CTA
 *  - right (mobile): burger -> full-height right-side drawer (animated)
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
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the mobile drawer is open, and close the drawer
  // on Escape so keyboard users can dismiss it without scrolling.
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Force the solid state while the mobile menu is open so the drawer panel
  // and its contents stay legible regardless of scroll position.
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
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
      };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,border-color,box-shadow,color] duration-300",
        solid
          ? "border-b border-brand-black/10 bg-brand-white/95 shadow-[0_8px_30px_-12px_rgba(29,29,27,0.18)] backdrop-blur"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-6 lg:h-20">
        <Link
          href="/"
          aria-label={siteConfig.name}
          className="flex shrink-0 items-center gap-2 transition-colors"
        >
          <span
            aria-hidden
            className={cn(
              "grid size-9 place-items-center rounded-md font-heading text-lg font-bold transition-colors",
              solid ? "bg-brand-red text-brand-white" : "bg-brand-white text-brand-black",
            )}
          >
            R
          </span>
          <span
            className={cn(
              "font-heading text-xl font-bold tracking-tight transition-colors lg:text-2xl",
              solid ? "text-brand-black" : "text-brand-white",
            )}
          >
            ROLLER<span className="text-brand-red">.TJ</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "group relative text-sm font-medium transition-colors hover:text-brand-red",
                solid ? "text-brand-black/80" : "text-brand-white/85",
              )}
            >
              {link.label}
              <span
                className={cn(
                  "absolute -bottom-1.5 left-0 h-0.5 w-0 bg-brand-red transition-all duration-300 group-hover:w-full",
                  solid ? "" : "bg-brand-white",
                )}
              />
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher solid={solid} />

          <a
            href={siteConfig.phoneHref}
            className={cn(
              "flex flex-col leading-tight transition-colors hover:text-brand-red",
              solid ? "text-brand-black" : "text-brand-white",
            )}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Phone className="size-4" />
              {siteConfig.phone}
            </span>
            <span
              className={cn(
                "pl-6 text-[11px] font-medium tracking-wide uppercase",
                solid ? "text-brand-black/45" : "text-brand-white/55",
              )}
            >
              {siteConfig.workingHours}
            </span>
          </a>
          <ButtonLink href={siteConfig.whatsappHref} size="sm" className="rounded-full">
            <MessageCircle className="size-4" />
            WhatsApp
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label="Меню"
          aria-expanded={open}
          aria-controls="mobile-drawer"
          className={cn(
            "grid size-10 place-items-center rounded-md transition-colors lg:hidden",
            solid
              ? "text-brand-black hover:bg-brand-black/5"
              : "text-brand-white hover:bg-brand-white/10",
          )}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

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
              className="fixed inset-0 z-40 bg-brand-black/50 lg:hidden"
            />
            <motion.aside
              key="drawer"
              id="mobile-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Мобильное меню"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed bottom-0 right-0 top-0 z-40 flex w-full max-w-sm flex-col bg-brand-white shadow-2xl lg:hidden"
            >
              <div className="flex h-16 shrink-0 items-center justify-between px-5">
                <span className="font-heading text-lg font-bold tracking-tight text-brand-black">
                  Меню
                </span>
                <button
                  type="button"
                  aria-label="Закрыть меню"
                  onClick={() => setOpen(false)}
                  className="grid size-10 place-items-center rounded-md text-brand-black transition-colors hover:bg-brand-black/5"
                >
                  <X className="size-6" />
                </button>
              </div>

              <motion.nav
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } } }}
              >
                {navLinks.map((link) => (
                  <motion.div key={link.href} variants={itemVariants}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-md px-3 py-3 text-base font-medium text-brand-black/80 transition-colors hover:bg-brand-black/5 hover:text-brand-red"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                <motion.div variants={itemVariants} className="mt-4 px-3">
                  <LanguageSwitcher solid={true} />
                </motion.div>

                <motion.div variants={itemVariants} className="mt-4 px-3">
                  <a
                    href={siteConfig.phoneHref}
                    className="flex items-center gap-3 rounded-md py-2 text-base font-semibold text-brand-black transition-colors hover:text-brand-red"
                  >
                    <Phone className="size-5" />
                    <span className="flex flex-col leading-tight">
                      <span>{siteConfig.phone}</span>
                      <span className="text-[11px] font-medium tracking-wide text-brand-black/45 uppercase">
                        {siteConfig.workingHours}
                      </span>
                    </span>
                  </a>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-3 px-3">
                  <ButtonLink
                    href={siteConfig.whatsappHref}
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    <MessageCircle className="size-4" />
                    Написать в WhatsApp
                  </ButtonLink>
                </motion.div>
              </motion.nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
