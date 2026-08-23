"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Trash2 } from "lucide-react";

import { DetailsPanel } from "@/components/calculator/details-panel";
import { SizeStage } from "@/components/calculator/size-stage";
import { VariantPicker } from "@/components/calculator/variant-picker";
import {
  constructionKinds,
  findScheme,
  sizeLimits,
  type ConfiguredItem,
  type ConstructionKind,
} from "@/data/calculator";
import { cn } from "@/lib/utils";

/** One position of the request: a construction, its size and its details. */
export function ItemCard({
  item,
  index,
  removable,
  onChange,
  onRemove,
}: {
  item: ConfiguredItem;
  index: number;
  removable: boolean;
  onChange: (patch: Partial<ConfiguredItem>) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("calculator");
  const tBrands = useTranslations("brands");
  const [open, setOpen] = useState(true);

  const scheme = findScheme(item.variant);
  const limits = sizeLimits[item.construction];
  const contentId = `position-${item.id}`;

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
            {t(`materials.${item.material}`)} {tBrands(`items.${item.system}.name`)}
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
            value={item.variant}
            onChange={(variant) => onChange({ variant })}
          />

          <div className="mt-10">
            <SizeStage
              scheme={scheme}
              lamination={item.lamination}
              hardware={item.hardware}
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
            <DetailsPanel item={item} onChange={onChange} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
