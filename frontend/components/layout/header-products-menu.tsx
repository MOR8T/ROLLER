"use client";

import { useTranslations } from "next-intl";
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion";
import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { categories, productHref, productsByCategory } from "@/data/catalog";
import { PRODUCTS_MENU_ID } from "./header-shared";

interface HeaderProductsMenuProps {
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
 * The panel *is* the catalog: a column per category, each listing the systems
 * that category claims. Nothing here is a summary that sends the visitor on to
 * a longer list — the menu ends at a product page, which is why the trigger no
 * longer navigates and why the old «Весь каталог» link at the top of the panel
 * is gone.
 *
 * A category heading is plain text, not a link. `/solutions/[category]` still
 * exists and the site still reaches it from `/catalog` and from the product
 * pages, but a menu whose headings navigate is a menu that opens index pages,
 * and that is exactly what this rebuild removed.
 *
 * A system appears in every category that claims it — ROLLER under «Окна» and
 * again under «Двери» — because that is what the many-to-many link means. A
 * category with no products yet is skipped rather than shown as an empty
 * column: with the list admin-managed, an empty category is a normal state
 * between creating it and filling it, not a layout to design around.
 */
export function HeaderProductsMenu({
  open,
  onOpen,
  onScheduleClose,
  onClose,
}: HeaderProductsMenuProps) {
  const prefersReducedMotion = useReducedMotion();
  const t = useTranslations("categories");
  const tBrands = useTranslations("brands");

  const filled = categories.filter((category) => category.productSlugs.length > 0);

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
          key="products-mega"
          id={PRODUCTS_MENU_ID}
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
            {/* Four across, wrapping. The number of categories is admin-managed
                and will not stay at six, so the grid is fixed in columns and
                free in rows rather than one column per category. */}
            <div className="grid gap-x-8 gap-y-8 xl:grid-cols-3 2xl:grid-cols-4">
              {filled.map((category) => (
                <div key={category.slug}>
                  <p className="px-4 text-xs font-medium tracking-[0.18em] text-brand-black/45 uppercase">
                    {t(`items.${category.slug}.title`)}
                  </p>

                  <ul className="mt-2 grid gap-0.5">
                    {productsByCategory(category.slug).map((product) => (
                      <li key={product.slug}>
                        <Link
                          href={productHref(product)}
                          onClick={onClose}
                          className="group flex flex-col gap-0.5 rounded-card px-4 py-2 transition-colors hover:bg-brand-black/4 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                        >
                          <span className="text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
                            {tBrands(`items.${product.slug}.name`)}
                          </span>
                          {/* Depth and chambers rather than the marketing line:
                              one row, and it is the number the visitor is
                              comparing the systems on. */}
                          <span className="text-xs leading-5 text-brand-black/55">
                            {tBrands("depth", { value: product.depthMm })} ·{" "}
                            {tBrands("chambers", { count: product.chambers })}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
