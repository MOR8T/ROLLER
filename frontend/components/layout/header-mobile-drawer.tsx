"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronDown, MessageCircle, Phone, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Link } from "@/i18n/navigation";
import { applicationHref, applications, categories, categoryHref } from "@/data/catalog";
import { navLinks, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./language-switcher";
import { CATALOG_HREF } from "./header-shared";

const emptySubscribe = () => () => {};

function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

interface HeaderMobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Full-height right-side drawer for mobile, portaled to `document.body` so it
 * escapes the sticky header's stacking context.
 *
 * Owns its own accessibility behaviour: body scroll lock, Escape to close, and
 * a focus trap so keyboard users can't tab out to the page behind the backdrop.
 */
export function HeaderMobileDrawer({ open, onClose }: HeaderMobileDrawerProps) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const isClient = useIsClient();
  const prefersReducedMotion = useReducedMotion();
  const drawerRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("header");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tApplications = useTranslations("applications");
  const tCategories = useTranslations("categories");

  const close = () => {
    setCatalogOpen(false);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus to the close button on open. Located by `data-drawer-close`
    // rather than by its label, which is now translated.
    const closeButton = drawer?.querySelector<HTMLElement>("[data-drawer-close]");
    const focusables = drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (closeButton ?? focusables?.[0])?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setCatalogOpen(false);
        onClose();
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
  }, [open, onClose]);

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

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            aria-hidden
            onClick={close}
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
            aria-label={t("mobileMenu")}
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
                onClick={close}
                className="flex items-center"
              >
                <BrandLogo isDark className="h-8 w-auto" />
              </Link>
              <button
                type="button"
                data-drawer-close
                aria-label={t("closeMenu")}
                onClick={close}
                className="grid size-10 place-items-center rounded-control text-brand-black transition-colors hover:bg-brand-black/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
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
              {navLinks.map((link) => {
                if (link.href === CATALOG_HREF) {
                  return (
                    <motion.div key={link.href} variants={itemVariants} className="flex flex-col">
                      <button
                        type="button"
                        aria-expanded={catalogOpen}
                        onClick={() => setCatalogOpen((v) => !v)}
                        className="flex w-full items-center justify-between gap-3 rounded-control px-3 py-3 text-left text-base font-medium text-brand-black/80 transition-colors hover:bg-brand-black/5 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        {tNav(link.key)}
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 transition-transform duration-200",
                            catalogOpen && "rotate-180",
                          )}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {catalogOpen && (
                          <motion.div
                            initial={
                              prefersReducedMotion
                                ? { opacity: 1, height: "auto" }
                                : { opacity: 0, height: 0 }
                            }
                            animate={{ opacity: 1, height: "auto" }}
                            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mb-2 ml-2 flex flex-col gap-0.5 border-l border-brand-black/10 pl-3">
                              {applications.map((application) => (
                                <Link
                                  key={application.slug}
                                  href={applicationHref(application.slug)}
                                  onClick={close}
                                  className="rounded-control px-3 py-2.5 text-sm text-brand-black/70 transition-colors hover:bg-brand-black/5 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                                >
                                  {tApplications(`items.${application.slug}.title`)}
                                </Link>
                              ))}
                              {/* The material split sits below the applications
                                  and above "весь каталог", mirroring the
                                  desktop mega-menu's two columns. */}
                              {categories.map((category) => (
                                <Link
                                  key={category.slug}
                                  href={categoryHref(category.slug)}
                                  onClick={close}
                                  className="rounded-control px-3 py-2.5 text-sm text-brand-black/70 transition-colors hover:bg-brand-black/5 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                                >
                                  {tCategories(`items.${category.slug}.title`)}
                                </Link>
                              ))}
                              <Link
                                href={CATALOG_HREF}
                                onClick={close}
                                className="rounded-control px-3 py-2.5 text-sm font-semibold text-brand-black transition-colors hover:bg-brand-black/5 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                              >
                                {tCommon("allCatalog")}
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                }

                return (
                  <motion.div key={link.href} variants={itemVariants}>
                    <Link
                      href={link.href}
                      onClick={close}
                      className="block rounded-control px-3 py-3 text-base font-medium text-brand-black/80 transition-colors hover:bg-brand-black/5 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {tNav(link.key)}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div variants={itemVariants} className="mt-4 px-3">
                <LanguageSwitcher />
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
                className="flex items-center gap-3 rounded-control py-1 text-base font-semibold text-brand-black transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Phone className="size-5 shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span>{siteConfig.phone}</span>
                  <span className="text-[11px] font-medium tracking-wide text-brand-black/55 uppercase">
                    {tCommon("workingHours")}
                  </span>
                </span>
              </motion.a>

              <motion.div variants={itemVariants}>
                <ButtonLink href={siteConfig.whatsappHref} className="w-full" onClick={close}>
                  <MessageCircle className="size-4 shrink-0" />
                  {tCommon("writeWhatsapp")}
                </ButtonLink>
              </motion.div>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
