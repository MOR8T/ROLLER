"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { catalogMenu } from "@/lib/site-config";
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
 */
export function HeaderCatalogMenu({
  open,
  onOpen,
  onScheduleClose,
  onClose,
}: HeaderCatalogMenuProps) {
  const prefersReducedMotion = useReducedMotion();

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
          aria-label="Категории каталога"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onMouseEnter={onOpen}
          onMouseLeave={onScheduleClose}
          className="absolute inset-x-0 top-full hidden border-b border-brand-black/10 bg-brand-white shadow-[0_18px_40px_-20px_rgba(29,29,27,0.28)] xl:block"
        >
          <Container className="py-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-medium tracking-[0.18em] text-brand-black/45 uppercase">
                  Каталог продукции
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-brand-black">
                  Выберите категорию
                </p>
              </div>
              <Link
                href={CATALOG_HREF}
                onClick={onClose}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red transition-colors hover:text-brand-black focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Весь каталог
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <ul className="mt-6 grid gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catalogMenu.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group flex flex-col gap-1 rounded-card px-4 py-3.5 transition-colors hover:bg-brand-black/4 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
                      {item.label}
                      <ArrowUpRight className="size-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </span>
                    <span className="text-xs leading-5 text-brand-black/55">
                      {item.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
