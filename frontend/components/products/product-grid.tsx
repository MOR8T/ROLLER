import type { ReactNode } from "react";

import { ProductCard } from "@/components/products/product-card";
import { cn } from "@/lib/utils";
import type { ProductBase } from "@/data/products";

/**
 * The one grid of system cards, shared by `/catalog`, the category pages and
 * the application landings.
 *
 * `empty` is required rather than optional. A category or an application can
 * legitimately list nothing — mosquito nets have an SEO landing but no profile
 * system behind them yet, because components are not in the catalog at launch
 * (plan §"Заметки") — and a silently empty grid would read as a bug.
 */
export function ProductGrid({
  products,
  chooseHref,
  empty,
  className,
}: {
  products: ProductBase[];
  chooseHref: string;
  empty: ReactNode;
  className?: string;
}) {
  if (products.length === 0) return <>{empty}</>;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5", className)}>
      {products.map((product) => (
        <ProductCard key={product.slug} product={product} chooseHref={chooseHref} />
      ))}
    </div>
  );
}

/** The neutral panel shown in place of the grid. */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border border-dashed border-brand-black/15 bg-surface-muted px-6 py-14 text-center">
      <p className="font-heading text-xl font-semibold text-brand-black">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-brand-black/65">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
