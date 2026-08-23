"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { ConstructionScheme } from "@/components/calculator/construction-scheme";
import { clamp, type LaminationKey, type Range, type Scheme } from "@/data/calculator";
import { cn } from "@/lib/utils";

/**
 * The construction's drawing, with the two sliders that set its size.
 *
 * Height runs up the right-hand side and width along the bottom, the way
 * `imzo.uz` arranges them and the way a joiner reads a drawing. The vertical
 * one is a real vertical `<input type="range">` rather than a rotated
 * horizontal one, so arrow keys, screen readers and touch all behave.
 *
 * The sliders do not resize the drawing — see `ConstructionScheme`. They set
 * the millimetres that travel with the request, and the drawing keeps the
 * proportions it was drawn in.
 *
 * The readouts are editable. `imzo.uz` prints them as text, but somebody who
 * already measured the opening knows it is 1730 and cannot drag to it — the
 * input is styled as the label it replaces, so the page reads the same.
 */
export function SizeStage({
  scheme,
  lamination,
  hardware,
  widthMm,
  heightMm,
  limits,
  onWidth,
  onHeight,
  title,
}: {
  scheme: Scheme;
  lamination: LaminationKey;
  hardware: LaminationKey;
  widthMm: number;
  heightMm: number;
  limits: { width: Range; height: Range };
  onWidth: (value: number) => void;
  onHeight: (value: number) => void;
  title: string;
}) {
  const t = useTranslations("calculator");

  return (
    <div className="mx-auto grid w-full max-w-[34rem] grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
      <div className="flex h-[17rem] items-center justify-center rounded-card border border-brand-black/8 bg-surface p-4 sm:h-[22rem]">
        <ConstructionScheme
          scheme={scheme}
          lamination={lamination}
          hardware={hardware}
          title={title}
        />
      </div>

      <div className="flex h-[17rem] flex-col items-center gap-3 sm:h-[22rem]">
        <Readout
          value={heightMm}
          range={limits.height}
          unit={t("units.mm")}
          label={t("labels.height")}
          onChange={onHeight}
        />
        <input
          type="range"
          aria-label={t("labels.height")}
          min={limits.height.min}
          max={limits.height.max}
          step={limits.height.step}
          value={heightMm}
          onChange={(event) => onHeight(Number(event.target.value))}
          className="cal-range cal-range--vertical min-h-0 flex-1"
        />
      </div>

      <div className="flex items-center">
        <input
          type="range"
          aria-label={t("labels.width")}
          min={limits.width.min}
          max={limits.width.max}
          step={limits.width.step}
          value={widthMm}
          onChange={(event) => onWidth(Number(event.target.value))}
          className="cal-range w-full"
        />
      </div>
      <Readout
        value={widthMm}
        range={limits.width}
        unit={t("units.mm")}
        label={t("labels.width")}
        onChange={onWidth}
      />
    </div>
  );
}

function Readout({
  value,
  range,
  unit,
  label,
  onChange,
}: {
  value: number;
  range: Range;
  unit: string;
  label: string;
  onChange: (value: number) => void;
}) {
  const id = useId();

  return (
    <span className="inline-flex items-baseline gap-1 text-sm whitespace-nowrap text-brand-black/70">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={range.min}
        max={range.max}
        step={range.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onBlur={(event) => onChange(clamp(Number(event.target.value), range))}
        className={cn(
          "w-[4.5ch] border-b border-transparent bg-transparent text-right tabular-nums",
          "outline-none focus:border-brand-red",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
      />
      {unit}
    </span>
  );
}
