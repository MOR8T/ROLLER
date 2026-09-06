import { Fragment } from "react";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

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
export function Breadcrumbs({
  items,
  tone = "light",
}: {
  items: Crumb[];
  tone?: "light" | "dark";
}) {
  const t = useTranslations("breadcrumbs");
  const trail: Crumb[] = [{ label: t("home"), href: "/" }, ...items];
  const dark = tone === "dark";

  return (
    <nav aria-label={t("aria")}>
      <ol
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 text-sm",
          dark ? "text-brand-white/60" : "text-brand-black/55",
        )}
      >
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;

          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li>
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className="transition-colors hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none active:text-brand-red"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current="page"
                    className={cn("font-medium", dark ? "text-brand-white" : "text-brand-black")}
                  >
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
