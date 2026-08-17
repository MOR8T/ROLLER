"use client";

import { useCallback, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus, Trash2 } from "lucide-react";

import { ConstructionPreview } from "@/components/calculator/construction-preview";
import { RequestForm } from "@/components/forms/request-form";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { colorSwatches } from "@/data/catalog";
import {
  MAX_ITEMS,
  MAX_QUANTITY,
  MAX_SASHES,
  accessoriesFor,
  clamp,
  colorsOf,
  constructionKinds,
  createItem,
  doorLayouts,
  optionsOf,
  reconcile,
  sizeLimits,
  systemsFor,
  type ConfiguredItem,
  type ConstructionKind,
  type DoorLayout,
  type OpeningType,
  type Range as SizeRange,
} from "@/data/calculator";
import { cn } from "@/lib/utils";

/**
 * The calculator (`project_plan/06-*.md`, decision 14).
 *
 * It is **not** a price calculator and never shows a number in somoni: the
 * brief asks for a calculator in §2.1 and forbids prices in §5.3, and the
 * parameters it lists could not produce a price anyway. What it produces is a
 * described construction attached to a request — the same resolution
 * `imzo.uz/calculator` reaches.
 *
 * Every edit goes through `reconcile` in `data/calculator.ts` rather than
 * being guarded field by field, because the invalid states all have one shape:
 * a choice that was legal under the previous system surviving into the next.
 */

export function Calculator() {
  const t = useTranslations("calculator");
  const tBrands = useTranslations("brands");
  const tColors = useTranslations("colors");

  const [items, setItems] = useState<ConfiguredItem[]>(() => [createItem("window")]);

  const update = (id: string, patch: Partial<ConfiguredItem>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? reconcile({ ...item, ...patch }) : item)),
    );

  const describe = useCallback(
    (item: ConfiguredItem, index: number) => {
      const parts = [
        t(`construction.${item.construction}`),
        tBrands(`items.${item.system}.name`),
        `${item.widthMm}×${item.heightMm} ${t("units.mm")}`,
        item.construction === "window"
          ? `${t("labels.sashes")}: ${item.sashes.map((opening) => t(`openings.${opening}`)).join(", ")}`
          : t(`layouts.${item.doorLayout}`),
        t(`glazing.${item.glazing}`),
        tColors(item.color),
        `${item.quantity} ${t("units.pcs")}`,
      ];

      if (item.accessories.length > 0) {
        parts.push(item.accessories.map((key) => t(`accessories.${key}`)).join(", "));
      }

      return `${index + 1}. ${parts.join(" · ")}`;
    },
    [t, tBrands, tColors],
  );

  // Read at submit time by `RequestForm`, which is why it is a callback rather
  // than a rendered string: the summary is not shown inside the form.
  const buildConfiguration = useCallback(() => items.map(describe).join("\n"), [items, describe]);

  return (
    <>
      <Section>
        <Container>
          <div className="flex flex-col gap-8">
            {items.map((item, index) => (
              <ItemEditor
                key={item.id}
                item={item}
                index={index}
                removable={items.length > 1}
                onChange={(patch) => update(item.id, patch)}
                onRemove={() =>
                  setItems((current) => current.filter((candidate) => candidate.id !== item.id))
                }
              />
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setItems((current) => [...current, createItem("window")])}
              disabled={items.length >= MAX_ITEMS}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              {t("item.add")}
            </Button>
            <p className="text-sm text-brand-black/55">
              {items.length >= MAX_ITEMS
                ? t("item.addLimit", { max: MAX_ITEMS })
                : t("item.addHint")}
            </p>
          </div>
        </Container>
      </Section>

      <Section tone="muted" id="calculator-request">
        <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <SectionHeading
              eyebrow={t("request.eyebrow")}
              title={t("request.title")}
              description={t("request.description")}
            />

            <div className="mt-8 rounded-card border border-brand-black/10 bg-surface p-5 sm:p-6">
              <h3 className="text-sm font-semibold tracking-[0.16em] text-brand-black/45 uppercase">
                {t("summary.title")}
              </h3>
              <ol className="mt-4 space-y-3">
                {items.map((item, index) => (
                  <li key={item.id} className="text-sm leading-6 text-brand-black/75">
                    {describe(item, index)}
                  </li>
                ))}
              </ol>
              <p className="mt-5 text-xs leading-5 text-brand-black/55">{t("noPrice")}</p>
            </div>
          </div>

          <RequestForm scenarios={["calculate", "quote"]} buildConfiguration={buildConfiguration} />
        </Container>
      </Section>
    </>
  );
}

function ItemEditor({
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
  const tColors = useTranslations("colors");

  const options = optionsOf(item.system);
  // ⚠️ One list, not a material chip row feeding a system chip row. The client
  // removed the ПВХ/алюминий split on 2026-08-17, and a step that asks which
  // material you want before it shows you a system is that split with another
  // name.
  const available = systemsFor(item.construction);
  const colors = colorsOf(item.system);
  const limits = sizeLimits[item.construction];
  const possibleAccessories = accessoriesFor(item.construction);

  const setSashCount = (count: number) => {
    const next: OpeningType[] = Array.from(
      { length: count },
      (_, sashIndex) => item.sashes[sashIndex] ?? options.openings[0],
    );
    onChange({ sashes: next });
  };

  const setSashOpening = (sashIndex: number, opening: OpeningType) =>
    onChange({
      sashes: item.sashes.map((current, position) => (position === sashIndex ? opening : current)),
    });

  return (
    <fieldset className="rounded-card border border-brand-black/10 bg-surface p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <legend className="font-heading text-sm font-semibold tracking-[0.16em] text-brand-black/45 uppercase">
          {t("item.legend", { index: index + 1 })}
        </legend>
        {removable ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="size-4 shrink-0" aria-hidden />
            {t("item.remove")}
          </Button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        {/* Preview first on mobile: the drawing is what makes the option lists
            legible, and DESIGN.md §8 puts the meaningful motion on the product,
            not on the controls. */}
        <div className="order-first">
          <div className="flex h-64 items-center justify-center rounded-card bg-surface-muted p-5 sm:h-80">
            <ConstructionPreview
              item={item}
              label={t("previewAria", {
                construction: t(`construction.${item.construction}`),
                width: item.widthMm,
                height: item.heightMm,
              })}
            />
          </div>
          <p className="mt-3 text-center text-xs text-brand-black/50">
            {item.widthMm} × {item.heightMm} {t("units.mm")}
          </p>
        </div>

        <div className="space-y-7">
          <ChipGroup
            label={t("labels.construction")}
            options={constructionKinds}
            value={item.construction}
            onChange={(construction: ConstructionKind) => onChange({ construction })}
            optionLabel={(kind) => t(`construction.${kind}`)}
          />

          <ChipGroup
            label={t("labels.system")}
            options={available.map((system) => system.slug)}
            value={item.system}
            onChange={(system: string) => onChange({ system })}
            optionLabel={(slug) => tBrands(`items.${slug}.name`)}
          />

          {item.construction === "window" ? (
            <>
              <ChipGroup
                label={t("labels.sashCount")}
                options={Array.from({ length: MAX_SASHES }, (_, i) => i + 1)}
                value={item.sashes.length}
                onChange={setSashCount}
                optionLabel={(count) => String(count)}
              />

              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase">
                  {t("labels.opening")}
                </p>
                <div className="mt-3 space-y-3">
                  {item.sashes.map((opening, sashIndex) => (
                    <ChipGroup
                      key={sashIndex}
                      label={t("labels.sash", { index: sashIndex + 1 })}
                      options={options.openings}
                      value={opening}
                      onChange={(next: OpeningType) => setSashOpening(sashIndex, next)}
                      optionLabel={(key) => t(`openings.${key}`)}
                      compact
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <ChipGroup
              label={t("labels.layout")}
              options={doorLayouts}
              value={item.doorLayout}
              onChange={(doorLayout: DoorLayout) => onChange({ doorLayout })}
              optionLabel={(key) => t(`layouts.${key}`)}
            />
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <SizeField
              label={t("labels.width")}
              range={limits.width}
              value={item.widthMm}
              unit={t("units.mm")}
              onChange={(widthMm) => onChange({ widthMm })}
            />
            <SizeField
              label={t("labels.height")}
              range={limits.height}
              value={item.heightMm}
              unit={t("units.mm")}
              onChange={(heightMm) => onChange({ heightMm })}
            />
          </div>

          <ChipGroup
            label={t("labels.glazing")}
            options={options.glazing}
            value={item.glazing}
            onChange={(glazing) => onChange({ glazing })}
            optionLabel={(key) => t(`glazing.${key}`)}
          />

          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase">
              {t("labels.color")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {colors.map((color) => {
                const active = color === item.color;

                return (
                  <button
                    key={color}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChange({ color })}
                    title={tColors(color)}
                    className={cn(
                      "flex items-center gap-2 rounded-control border py-1.5 pr-3 pl-1.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                      active
                        ? "border-brand-black bg-brand-black text-brand-white"
                        : "border-brand-black/15 text-brand-black/75 hover:border-brand-red/50",
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-6 rounded-[0.35rem] border border-black/10"
                      style={{ background: colorSwatches[color] }}
                    />
                    {tColors(color)}
                  </button>
                );
              })}
            </div>
            {/* ЭКОЛАЙН ships in white only (brief §7.5) — the row collapses to
                one swatch and says why rather than looking broken. */}
            {colors.length === 1 ? (
              <p className="mt-3 text-sm text-brand-black/55">{t("colorSingleNote")}</p>
            ) : null}
          </div>

          {possibleAccessories.length > 0 ? (
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase">
                {t("labels.accessories")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {possibleAccessories.map((key) => {
                  const active = item.accessories.includes(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        onChange({
                          accessories: active
                            ? item.accessories.filter((current) => current !== key)
                            : [...item.accessories, key],
                        })
                      }
                      className={cn(
                        "rounded-control border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                        active
                          ? "border-brand-red bg-brand-red/10 text-brand-red"
                          : "border-brand-black/15 text-brand-black/75 hover:border-brand-red/50",
                      )}
                    >
                      {t(`accessories.${key}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Quantity
            label={t("labels.quantity")}
            value={item.quantity}
            unit={t("units.pcs")}
            decreaseLabel={t("item.decrease")}
            increaseLabel={t("item.increase")}
            onChange={(quantity) => onChange({ quantity })}
          />
        </div>
      </div>
    </fieldset>
  );
}

function ChipGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  optionLabel,
  compact = false,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
  optionLabel: (option: T) => string;
  compact?: boolean;
}) {
  return (
    <div className={cn(compact && "flex flex-wrap items-center gap-x-3 gap-y-2")}>
      <p
        className={cn(
          "text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase",
          compact && "min-w-24",
        )}
      >
        {label}
      </p>
      <div className={cn("flex flex-wrap gap-2", !compact && "mt-3")}>
        {options.map((option) => {
          const active = option === value;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option)}
              className={cn(
                "rounded-control border px-3.5 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                active
                  ? "border-brand-black bg-brand-black text-brand-white"
                  : "border-brand-black/15 bg-surface text-brand-black/75 hover:border-brand-red/50 hover:text-brand-red",
              )}
            >
              {optionLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * A slider paired with a number box. The slider is what makes the preview feel
 * live; the number box is what a person who already knows the opening size
 * needs, and typing 1730 with a slider alone is not possible.
 */
function SizeField({
  label,
  range,
  value,
  unit,
  onChange,
}: {
  label: string;
  range: SizeRange;
  value: number;
  unit: string;
  onChange: (next: number) => void;
}) {
  const id = useId();

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={id}
          className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase"
        >
          {label}
        </label>
        <span className="text-xs text-brand-black/45">
          {range.min}–{range.max} {unit}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer accent-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        />
        <input
          type="number"
          inputMode="numeric"
          min={range.min}
          max={range.max}
          step={range.step}
          value={value}
          aria-label={label}
          onChange={(event) => onChange(Number(event.target.value))}
          onBlur={(event) => onChange(clamp(Number(event.target.value), range))}
          className="h-11 w-24 shrink-0 rounded-control border border-brand-black/15 bg-surface px-3 text-sm transition-colors outline-none focus:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
        />
      </div>
    </div>
  );
}

function Quantity({
  label,
  value,
  unit,
  decreaseLabel,
  increaseLabel,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  decreaseLabel: string;
  increaseLabel: string;
  onChange: (next: number) => void;
}) {
  const id = useId();

  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase"
      >
        {label}
      </label>
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={decreaseLabel}
          disabled={value <= 1}
          onClick={() => onChange(value - 1)}
        >
          <Minus className="size-4 shrink-0" aria-hidden />
        </Button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QUANTITY}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-11 w-20 rounded-control border border-brand-black/15 bg-surface px-3 text-center text-sm transition-colors outline-none focus:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={increaseLabel}
          disabled={value >= MAX_QUANTITY}
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-4 shrink-0" aria-hidden />
        </Button>
        <span className="text-sm text-brand-black/55">{unit}</span>
      </div>
    </div>
  );
}
