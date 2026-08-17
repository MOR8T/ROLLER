"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { EmptyState, ProductGrid } from "@/components/catalog/product-grid";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categories, productsByCategory, products, segments } from "@/data/catalog";
import type { Segment } from "@/types";

/**
 * The catalog's filter row and grid.
 *
 * Two facets: category and segment. Material was the third until 2026-08-17 and
 * went with the rest of the split — it is a line in the spec table now, not a
 * way to browse. State is local rather than in the URL: the catalog holds six
 * systems, so filtering is instant and there is nothing to fetch, while the
 * page worth sharing and indexing is `/solutions/[category]`, a real route with
 * its own copy.
 *
 * No `RevealGroup` around the grid. Its reveal is a scroll-driven CSS
 * animation, and a card that mounts already past the trigger range stays at
 * `opacity: 0` — which is precisely what filtering does.
 */

const ALL = "all" as const;
type Filter<T extends string> = T | typeof ALL;

function FilterRow<T extends string>({
  label,
  options,
  value,
  onChange,
  optionLabel,
  allLabel,
}: {
  label: string;
  options: readonly T[];
  value: Filter<T>;
  onChange: (next: Filter<T>) => void;
  optionLabel: (option: T) => string;
  allLabel: string;
}) {
  const choices: Filter<T>[] = [ALL, ...options];

  return (
    <fieldset className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <legend className="sr-only">{label}</legend>
      <span
        aria-hidden
        className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase"
      >
        {label}
      </span>
      {choices.map((choice) => {
        const active = choice === value;

        return (
          <button
            key={choice}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(choice)}
            className={cn(
              "rounded-control border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
              active
                ? "border-brand-black bg-brand-black text-brand-white"
                : "border-brand-black/15 bg-surface text-brand-black/75 hover:border-brand-red/50 hover:text-brand-red",
            )}
          >
            {choice === ALL ? allLabel : optionLabel(choice)}
          </button>
        );
      })}
    </fieldset>
  );
}

export function CatalogBrowser({ chooseHref }: { chooseHref: string }) {
  const t = useTranslations("catalog");
  const tSegments = useTranslations("segments");
  const tCategories = useTranslations("categories");

  const [category, setCategory] = useState<Filter<string>>(ALL);
  const [segment, setSegment] = useState<Filter<Segment>>(ALL);

  const visible = useMemo(() => {
    // The category owns the link, so membership is read from its own list
    // rather than from a field on the product.
    const inCategory = category === ALL ? products : productsByCategory(category);

    return inCategory.filter((product) => segment === ALL || product.segment === segment);
  }, [category, segment]);

  const dirty = category !== ALL || segment !== ALL;

  const reset = () => {
    setCategory(ALL);
    setSegment(ALL);
  };

  return (
    <div>
      <div
        role="group"
        aria-label={t("filters.aria")}
        className="flex flex-col gap-4 rounded-card border border-brand-black/10 bg-surface p-5 sm:p-6"
      >
        <FilterRow
          label={t("filters.category")}
          options={categories.map((item) => item.slug)}
          value={category}
          onChange={setCategory}
          optionLabel={(slug) => tCategories(`items.${slug}.title`)}
          allLabel={t("filters.all")}
        />
        <FilterRow
          label={t("filters.segment")}
          options={segments}
          value={segment}
          onChange={setSegment}
          optionLabel={(slug) => tSegments(slug)}
          allLabel={t("filters.all")}
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {/* `aria-live`: the count is the only feedback a screen-reader user
            gets that pressing a filter did anything. */}
        <p aria-live="polite" className="text-sm text-brand-black/60">
          {t("filters.results", { count: visible.length })}
        </p>
        {dirty ? (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            {t("filters.reset")}
          </Button>
        ) : null}
      </div>

      <ProductGrid
        className="mt-6"
        products={visible}
        chooseHref={chooseHref}
        empty={
          <EmptyState
            title={t("empty.title")}
            description={t("empty.description")}
            action={
              <Button type="button" variant="outline" onClick={reset}>
                {t("filters.reset")}
              </Button>
            }
          />
        }
      />
    </div>
  );
}
