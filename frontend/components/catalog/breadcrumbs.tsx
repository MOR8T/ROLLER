import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export interface Crumb {
  label: string;
  /** Omitted on the last crumb, which is the current page. */
  href?: string;
}

/**
 * Catalog → category → product, and catalog → application → product. The trail
 * is the only thing on a landing page that says which of the two axes the
 * visitor came in on, so every page below `/catalog` and `/solutions` carries
 * one. The "Главная" crumb is prepended here rather than by each caller.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations("breadcrumbs");
  const trail: Crumb[] = [{ label: t("home"), href: "/" }, ...items];

  return (
    <nav aria-label={t("aria")}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-black/55">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;

          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="font-medium text-brand-black">
                    {crumb.label}
                  </span>
                )}
              </li>
              {!isLast && <ChevronRight aria-hidden className="size-3.5 shrink-0" />}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
