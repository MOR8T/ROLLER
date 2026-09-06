"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { SchemeView } from "@/components/calculator/scheme-view";
import { clamp, type Range } from "@/data/calculator";
import type { SchemeGeometry } from "@/lib/scheme-geometry";
import { cn } from "@/lib/utils";

/**
 * The construction's drawing, with the two sliders that set its size.
 *
 * Height runs up the right-hand side and width along the bottom, the way
 * `imzo.uz` arranges them and the way a joiner reads a drawing. The vertical
 * one is a real vertical `<input type="range">` rather than a rotated
 * horizontal one, so arrow keys, screen readers and touch all behave.
 *
 * The sliders *do* resize the drawing now. They used to not: the old renderer
 * inlined the client's own SVG, and a drawing is a picture of a type of
 * construction rather than an elevation of one, so stretching it to 3000x400
 * drew stiles half a metre thick. `SchemeView` computes the geometry instead,
 * keeping the profile a constant 60 mm at every size, so a wide transom light
 * now reads as a wide transom light.
 *
 * The readouts are editable. `imzo.uz` prints them as text, but somebody who
 * already measured the opening knows it is 1730 and cannot drag to it — the
 * input is styled as the label it replaces, so the page reads the same.
 *
 * ── The size fields ───────────────────────────────────────────────────────
 *
 * `SizeFields` sits above the drawing and duplicates that same pair of
 * numbers as two ordinary, labelled form fields. The sliders and the readouts
 * stay exactly as they were — this is an *additional* way in, not a
 * replacement, because the readouts are small, unlabelled and easy to miss,
 * and a visitor who arrives with a tape measure wants a field to type into.
 *
 * The difference that matters is when the value commits. The readouts push
 * every keystroke straight into `reconcile`, which clamps it, so typing 1730
 * one digit at a time snaps to the minimum on the first character. The fields
 * hold a draft string instead and commit on blur or Enter, so a four-digit
 * measurement can actually be typed.
 *
 * ── The render viewport ───────────────────────────────────────────────────
 *
 * The stage is sized against the viewport (80vw x 65vh) rather than to a
 * fixed 34/44rem: the drawing is the thing a visitor is looking at while they
 * drag, and a box taller than the screen means dragging the width slider with
 * the construction scrolled out of sight. `max-w-full` keeps it inside the
 * container on wide screens, and the clamps stop it collapsing on a short
 * phone or ballooning on a 4K panel.
 */
export function SizeStage({
  scheme,
  laminationTexture,
  laminationColor,
  hardwareColor,
  widthMm,
  heightMm,
  limits,
  onWidth,
  onHeight,
  title,
}: {
  scheme: SchemeGeometry;
  laminationTexture: string | null;
  laminationColor: string;
  hardwareColor: string;
  widthMm: number;
  heightMm: number;
  limits: { width: Range; height: Range };
  onWidth: (value: number) => void;
  onHeight: (value: number) => void;
  title: string;
}) {
  const t = useTranslations("calculator");

  // One height for both columns, so the vertical slider tracks the drawing.
  const stageHeight = "h-[min(65vh,var(--cal-stage-max))] min-h-[18rem]";

  return (
    <div className="mx-auto w-[80vw] max-w-full [--cal-stage-max:44rem]">
      <SizeFields
        widthMm={widthMm}
        heightMm={heightMm}
        limits={limits}
        onWidth={onWidth}
        onHeight={onHeight}
      />

      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3">
        <div
          className={cn(
            "flex items-center justify-center rounded-card border border-brand-black/8 bg-surface p-4",
            stageHeight,
          )}
        >
          <SchemeView
            scheme={scheme}
            widthMm={widthMm}
            heightMm={heightMm}
            laminationTexture={laminationTexture}
            laminationColor={laminationColor}
            hardwareColor={hardwareColor}
            dimensions
            title={title}
          />
        </div>

        <div className={cn("flex flex-col items-center gap-3", stageHeight)}>
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The typed way in: «Ширина, мм» and «Высота, мм» as ordinary form fields.
 *
 * Deliberately additive — the sliders and the readouts on the drawing are
 * untouched and stay in sync with these, because all three write the same two
 * numbers through the same `onWidth`/`onHeight`.
 */
function SizeFields({
  widthMm,
  heightMm,
  limits,
  onWidth,
  onHeight,
}: {
  widthMm: number;
  heightMm: number;
  limits: { width: Range; height: Range };
  onWidth: (value: number) => void;
  onHeight: (value: number) => void;
}) {
  const t = useTranslations("calculator");

  return (
    <div className="mb-6 flex flex-wrap items-start gap-4">
      <SizeField
        label={`${t("labels.width")}, ${t("units.mm")}`}
        value={widthMm}
        range={limits.width}
        onCommit={onWidth}
      />
      <span className="hidden self-center pt-6 text-lg text-brand-black/30 sm:inline" aria-hidden>
        ×
      </span>
      <SizeField
        label={`${t("labels.height")}, ${t("units.mm")}`}
        value={heightMm}
        range={limits.height}
        onCommit={onHeight}
      />
    </div>
  );
}

function SizeField({
  label,
  value,
  range,
  onCommit,
}: {
  label: string;
  value: number;
  range: Range;
  onCommit: (value: number) => void;
}) {
  const id = useId();
  // A draft, so a four-digit number can be typed a digit at a time: committing
  // on every keystroke would send `1` to `reconcile`, which clamps it to the
  // minimum and takes the caret with it.
  const [draft, setDraft] = useState(String(value));
  const [seen, setSeen] = useState(value);

  // The sliders and the readouts write the same two numbers, so the field has
  // to follow when one of them moves — adjusted during render rather than in
  // an effect, which is React's own recipe for state derived from a prop and
  // the one the lint rule enforces. Only a *change* in `value` rewrites the
  // draft, so committing 1730 does not stomp on a caret sitting in it.
  if (value !== seen) {
    setSeen(value);
    if (Number(draft) !== value) setDraft(String(value));
  }

  const commit = () => {
    const next = clamp(Number(draft), range);
    setDraft(String(next));
    onCommit(next);
  };

  return (
    <label htmlFor={id} className="flex min-w-36 flex-col gap-1.5">
      <span className="text-sm font-medium text-brand-black">{label}</span>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={range.min}
        max={range.max}
        step={range.step}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className={cn(
          "min-h-12 w-36 rounded-control border border-brand-black/20 bg-surface px-4 text-base text-brand-black tabular-nums",
          "transition-colors hover:border-brand-black/45 active:border-brand-black/45",
          "focus:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
      />
      <span className="text-xs text-brand-black/50 tabular-nums">
        {range.min} – {range.max}
      </span>
    </label>
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
