"use client";

import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { applicationHref, applications, categories, categoryHref } from "@/data/catalog";
import { CATALOG_HREF } from "./header-shared";

interface HeaderCatalogMenuProps {
  open: boolean;
  /** Keep the panel open while the pointer is inside it. */
  onOpen: () => void;
  onScheduleClose: () => void;
  onClose: () => void;
}

/**
 * Desktop catalog mega-menu. Spans the full width directly below the header
 * bar, so it lives in the header rather than inside the nav item that opens it.
 *
 * Both columns come straight from `data/catalog.ts` — the same two lists the
 * catalog page renders. They used to be a hand-copied `catalogMenu` in
 * `lib/site-config.ts` carrying a "kept in sync" comment; reading the lists
 * keyed by slug removes the drift and means the labels are translated once
 * rather than twice.
 *
 * The layout mirrors the catalog's two axes: applications on the left, because
 * that is the question a visitor can answer, and the two materials on the right
 * as the structural split. Every entry is a page that exists — the plan's
 * requirement that the header stop pointing at routes that were never built.
 */
export function HeaderCatalogMenu({
  open,
  onOpen,
  onScheduleClose,
  onClose,
}: HeaderCatalogMenuProps) {
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations("applications");
  const tCategories = useTranslations("categories");
  const tCommon = useTranslations("common");

  const panelVariants: Variants = prefersReducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0, y: -8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const },
        },
        exit: {
          opacity: 0,
          y: -6,
          transition: { duration: 0.16, ease: [0.25, 0.1, 0.25, 1] as const },
        },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="catalog-mega"
          id="catalog-mega-menu"
          role="region"
          aria-label={t("eyebrow")}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseEnter={onOpen}
          onMouseLeave={onScheduleClose}
          className="absolute inset-x-0 top-full hidden border-b border-brand-black/10 bg-brand-white shadow-[0_18px_40px_-20px_rgba(29,29,27,0.28)] xl:block"
        >
          <Container className="py-8">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-brand-black/45 uppercase">
                  {t("eyebrow")}
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-brand-black">
                  {t("title")}
                </p>
              </div>
              <Link
                href={CATALOG_HREF}
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {tCommon("allCatalog")}
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="mt-6 grid gap-x-10 gap-y-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {applications.map((application) => (
                  <li key={application.slug}>
                    <Link
                      href={applicationHref(application.slug)}
                      onClick={onClose}
                      className="group flex flex-col gap-1 rounded-card px-4 py-3.5 transition-colors hover:bg-brand-black/4 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
                        {t(`items.${application.slug}.title`)}
                        <ArrowUpRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                      </span>
                      <span className="text-xs leading-5 text-brand-black/55">
                        {t(`items.${application.slug}.menuDescription`)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="xl:border-l xl:border-brand-black/10 xl:pl-10">
                <p className="px-4 text-xs font-medium tracking-[0.18em] text-brand-black/45 uppercase">
                  {tCategories("eyebrow")}
                </p>
                <ul className="mt-2 grid gap-1 sm:grid-cols-2 xl:grid-cols-1">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <Link
                        href={categoryHref(category.slug)}
                        onClick={onClose}
                        className="group flex flex-col gap-1 rounded-card px-4 py-3.5 transition-colors hover:bg-brand-black/4 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
                          {tCategories(`items.${category.slug}.title`)}
                          <ArrowUpRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                        </span>
                        <span className="text-xs leading-5 text-brand-black/55">
                          {tCategories(`items.${category.slug}.eyebrow`)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
