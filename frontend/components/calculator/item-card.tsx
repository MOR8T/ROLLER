"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Trash2 } from "lucide-react";

import { DetailsPanel } from "@/components/calculator/details-panel";
import { SizeStage } from "@/components/calculator/size-stage";
import { VariantPicker } from "@/components/calculator/variant-picker";
import {
  constructionKinds,
  defaultSizeOf,
  findScheme,
  findSeries,
  type CalculatorOptions,
  type ConfiguredItem,
  type ConstructionKind,
} from "@/data/calculator";
import type { SchemeGeometry } from "@/lib/scheme-geometry";
import { cn } from "@/lib/utils";

/** One position of the request: a construction, its size and its details. */
export function ItemCard({
  item,
  index,
  removable,
  schemes,
  options,
  onChange,
  onRemove,
}: {
  item: ConfiguredItem;
  index: number;
  removable: boolean;
  schemes: SchemeGeometry[];
  options: CalculatorOptions;
  onChange: (patch: Partial<ConfiguredItem>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("calculator");
  const [open, setOpen] = useState(true);

  const scheme = findScheme(schemes, item.variant);
  const limits = options.sizeLimits[item.construction];
  const contentId = `position-${item.id}`;

  // The palette is admin-managed, so a colour key can disappear between the
  // visitor picking it and this render. Falling back to the first entry keeps
  // the drawing painted rather than blanking it.
  const palette = options.laminations;
  // The series name comes from the admin's list, not the brands catalogue:
  // renaming a series there must show here rather than leaving a blank.
  const series = findSeries(options, item.system);
  const lamination = palette.find((c) => c.key === item.lamination) ?? palette[0];
  const hardware = palette.find((c) => c.key === item.hardware) ?? palette[0];

  if (!scheme) return null;

  return (
    <section className="rounded-card border border-brand-black/10 bg-surface">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={contentId}
          aria-label={open ? t("item.collapse") : t("item.expand")}
          onClick={() => setOpen((current) => !current)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-brand-black/15 text-brand-black transition-colors hover:border-brand-black/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ChevronDown
            className={cn("size-5 transition-transform", !open && "-rotate-90")}
            aria-hidden
          />
        </button>

        <p className="font-heading text-lg font-semibold text-brand-black/45">
          {t("item.legend", { index: index + 1 })}
        </p>

        <div className="min-w-0 flex-1">
          <h2 className="truncate font-heading text-lg font-semibold text-brand-black">
            {t(`construction.${item.construction}`)}
          </h2>
          <p className="truncate text-sm text-brand-black/55">
            {t(`materials.${item.material}`)} {series?.label ?? item.system}
          </p>
        </div>

        {removable ? (
          <button
            type="button"
            aria-label={t("item.remove")}
            onClick={onRemove}
            className="flex size-10 shrink-0 items-center justify-center rounded-control text-brand-black/45 transition-colors hover:bg-brand-red/10 hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Trash2 className="size-5" aria-hidden />
          </button>
        ) : null}
      </div>

      {open ? (
        <div id={contentId} className="border-t border-brand-black/10 px-4 py-7 sm:px-6 sm:py-9">
          {/* First, because it decides which variants exist below it. */}
          <div
            role="group"
            aria-label={t("labels.construction")}
            className="mb-9 flex flex-wrap gap-3"
          >
            {constructionKinds.map((kind: ConstructionKind) => {
              const active = kind === item.construction;
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChange({ construction: kind })}
                  className={cn(
                    "min-h-12 min-w-32 rounded-control border px-7 text-sm font-medium transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                    active
                      ? "border-brand-black bg-brand-black text-brand-white"
                      : "border-brand-black/20 bg-surface text-brand-black hover:border-brand-black/45",
                  )}
                >
                  {t(`construction.${kind}`)}
                </button>
              );
            })}
          </div>

          <VariantPicker
            construction={item.construction}
            schemes={schemes}
            value={item.variant}
            laminationTexture={lamination?.texture ?? null}
            laminationColor={lamination?.hex ?? "#f2f2f0"}
            hardwareColor={hardware?.hex ?? "#f2f2f0"}
            // The size travels with the variant: each template opens at its
            // own proportions, so trying a five-sash run after a single
            // casement no longer means correcting both sliders first.
            onChange={(variant) =>
              onChange({
                variant,
                ...defaultSizeOf(findScheme(schemes, variant), item.construction, options),
              })
            }
          />

          <div className="mt-10">
            <SizeStage
              scheme={scheme}
              laminationTexture={lamination?.texture ?? null}
              laminationColor={lamination?.hex ?? "#f2f2f0"}
              hardwareColor={hardware?.hex ?? "#f2f2f0"}
              widthMm={item.widthMm}
              heightMm={item.heightMm}
              limits={limits}
              onWidth={(widthMm) => onChange({ widthMm })}
              onHeight={(heightMm) => onChange({ heightMm })}
              title={t("previewAria", {
                construction: t(`construction.${item.construction}`),
                width: item.widthMm,
                height: item.heightMm,
              })}
            />
          </div>

          <div className="mt-12">
            <DetailsPanel item={item} options={options} onChange={onChange} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
