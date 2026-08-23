"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { schemeUrl, variantGroups, type ConstructionKind, type Scheme } from "@/data/calculator";
import { cn } from "@/lib/utils";

/**
 * The row of variants at the top of a position.
 *
 * Same shape as `imzo.uz`: one column per group, the group's current pick shown
 * as a drawing, and the rest of the group behind a click. Grouping is by how
 * many sashes wide a variant reads — `variantGroups` — so a transom or an
 * arched head is a variation inside its group rather than a group of its own.
 *
 * Each group remembers what was last taken from it, which is what makes the row
 * usable: comparing a two-sash variant against a three-sash one is two clicks,
 * not two clicks and a re-hunt through nineteen drawings.
 */
export function VariantPicker({
  construction,
  value,
  onChange,
}: {
  construction: ConstructionKind;
  value: string;
  onChange: (variant: string) => void;
}) {
  const t = useTranslations("calculator");
  const groups = variantGroups(construction);
  const [open, setOpen] = useState<number | null>(null);
  const [picked, setPicked] = useState<Record<number, string>>({});
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open === null) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={root} className="flex flex-wrap gap-x-5 gap-y-7 sm:gap-x-10 sm:gap-y-8">
      {groups.map((group) => {
        const active = group.variants.some((variant) => variant.id === value);
        const shown =
          group.variants.find((variant) => variant.id === value) ??
          group.variants.find((variant) => variant.id === picked[group.columns]) ??
          group.variants[0];
        const label = t(`groups.${construction}.${group.columns}`);

        return (
          <div key={group.columns} className="relative">
            <h3
              className={cn(
                "font-heading text-sm font-semibold transition-colors sm:text-base",
                active ? "text-brand-red" : "text-brand-black",
              )}
            >
              {label}
            </h3>

            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open === group.columns}
              aria-label={`${label} — ${t("chooseVariant")}`}
              onClick={() => {
                onChange(shown.id);
                setOpen(open === group.columns ? null : group.columns);
              }}
              className={cn(
                "mt-3 flex h-[104px] w-[116px] items-center justify-center rounded-control border-2 bg-surface p-2 transition-colors sm:h-[120px] sm:w-[132px]",
                "focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                active ? "border-brand-red" : "border-brand-black/15 hover:border-brand-black/40",
              )}
            >
              <SchemeImage scheme={shown} />
            </button>

            {open === group.columns ? (
              <div
                role="listbox"
                className="absolute top-full left-0 z-20 mt-2 max-h-[19rem] w-max max-w-[min(28rem,80vw)] overflow-y-auto rounded-card border border-brand-black/10 bg-surface p-2.5 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.28)]"
              >
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {group.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      role="option"
                      aria-selected={variant.id === value}
                      onClick={() => {
                        setPicked((current) => ({ ...current, [group.columns]: variant.id }));
                        onChange(variant.id);
                        setOpen(null);
                      }}
                      className={cn(
                        "flex h-[68px] w-[76px] items-center justify-center rounded-control border p-1.5 transition-colors sm:h-[76px] sm:w-[86px]",
                        "focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:outline-none",
                        variant.id === value
                          ? "border-brand-red bg-brand-red/5"
                          : "border-brand-black/12 hover:border-brand-red/60",
                      )}
                    >
                      <SchemeImage scheme={variant} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SchemeImage({ scheme }: { scheme: Scheme }) {
  return (
    <Image
      src={schemeUrl(scheme)}
      alt=""
      width={Math.round(scheme.vw)}
      height={Math.round(scheme.vh)}
      className="max-h-full w-auto max-w-full object-contain"
      unoptimized
    />
  );
}
