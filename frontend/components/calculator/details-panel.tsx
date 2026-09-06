"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { Select } from "@/components/ui/select";
import {
  MAX_QUANTITY,
  accessoriesFor,
  glazingOf,
  materials,
  systemsFor,
  type AccessoryOption,
  type CalculatorOptions,
  type ConfiguredItem,
  type LaminationOption,
  type MaterialKind,
} from "@/data/calculator";
import { cn } from "@/lib/utils";

/**
 * «Детали расчёта» — everything about the construction that the drawing cannot
 * show, in `imzo.uz`'s order: material, series, glazing unit, mechanism,
 * lamination, hardware colour, extras, quantity.
 *
 * ⚠️ «Тип профиля: ПВХ / Алюминий» is deliberate and scoped. The client removed
 * the material split from the catalogue on 2026-08-17 and asked for it back
 * *here* on 2026-08-23, as half of imzo's «Тип профиля → Серия профиля» pair.
 * It selects a series; it does not reintroduce a material axis anywhere else.
 */
export function DetailsPanel({
  item,
  options,
  onChange,
}: {
  item: ConfiguredItem;
  /**
   * Every list an admin maintains at `/admin/calculator`. The same palette
   * paints the drawing in `SchemeView`, so a colour added there appears in
   * both rather than only in one.
   */
  options: CalculatorOptions;
  onChange: (patch: Partial<ConfiguredItem>) => void;
}) {
  const t = useTranslations("calculator");
  const uid = useId();

  const series = systemsFor(options, item.construction, item.material);
  const glazing = glazingOf(options, item.system);
  const extras = accessoriesFor(options, item.construction);

  return (
    <div className="space-y-6">
      <h3 className="font-heading text-xl font-semibold text-brand-black">{t("details.title")}</h3>

      <Field label={t("labels.material")}>
        <div className="grid grid-cols-2 gap-3">
          {materials.map((material: MaterialKind) => {
            const active = material === item.material;
            return (
              <button
                key={material}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ material })}
                className={cn(
                  "min-h-12 rounded-control border text-sm font-medium transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                  active
                    ? "border-brand-black bg-brand-black text-brand-white"
                    : "border-brand-black/20 bg-surface text-brand-black hover:border-brand-black/45 active:border-brand-black/45",
                )}
              >
                {t(`materials.${material}`)}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label={t("labels.series")} htmlFor={`${uid}-series`}>
        <Select
          id={`${uid}-series`}
          value={item.system}
          onChange={(event) => onChange({ system: event.target.value })}
        >
          {series.map((entry) => (
            <option key={entry.key} value={entry.key}>
              {entry.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("labels.glazing")} htmlFor={`${uid}-glazing`}>
        <Select
          id={`${uid}-glazing`}
          value={item.glazing}
          onChange={(event) =>
            onChange({ glazing: event.target.value as ConfiguredItem["glazing"] })
          }
        >
          {glazing.map((key) => (
            <option key={key} value={key}>
              {t(`glazing.${key}`)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("labels.mechanism")} htmlFor={`${uid}-mechanism`}>
        <Select
          id={`${uid}-mechanism`}
          value={item.mechanism}
          onChange={(event) => onChange({ mechanism: event.target.value })}
        >
          {options.mechanisms.map((mechanism) => (
            <option key={mechanism.key} value={mechanism.key}>
              {mechanism.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("labels.lamination")}>
        <Swatches
          options={options.laminations}
          value={item.lamination}
          onChange={(lamination) => onChange({ lamination })}
        />
      </Field>

      <Field label={t("labels.hardware")}>
        <Swatches
          options={options.laminations}
          value={item.hardware}
          onChange={(hardware) => onChange({ hardware })}
        />
      </Field>

      {extras.length > 0 ? (
        <Field label={t("labels.accessories")}>
          {/* `space-y-0.5` against each row's `py-1`: same rhythm as the old
              `space-y-2.5` on bare rows, but the row is 32px tall and clickable
              across the panel rather than an 18px box with a caption beside
              it. */}
          <div className="space-y-0.5">
            {extras.map((accessory: AccessoryOption) => {
              const key = accessory.key;
              const checked = item.accessories.includes(key);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 py-1 text-sm text-brand-black/80"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        accessories: checked
                          ? item.accessories.filter((current) => current !== key)
                          : [...item.accessories, key],
                      })
                    }
                    className="size-[18px] shrink-0 accent-brand-red"
                  />
                  {accessory.label}
                </label>
              );
            })}
          </div>
        </Field>
      ) : null}

      <Field label={t("labels.quantity")} htmlFor={`${uid}-quantity`}>
        <input
          id={`${uid}-quantity`}
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_QUANTITY}
          value={item.quantity}
          onChange={(event) => onChange({ quantity: Number(event.target.value) })}
          className="h-12 w-full rounded-control border border-brand-black/15 bg-surface px-4 text-sm transition-colors outline-none focus:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2"
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Tag = htmlFor ? "label" : "p";
  return (
    <div>
      <Tag
        {...(htmlFor ? { htmlFor } : {})}
        className="block font-heading text-base font-semibold text-brand-black"
      >
        {label}
      </Tag>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Swatches({
  options,
  value,
  onChange,
}: {
  options: LaminationOption[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((colour) => {
        const active = colour.key === value;
        return (
          <button
            key={colour.key}
            type="button"
            aria-pressed={active}
            title={colour.label}
            aria-label={colour.label}
            onClick={() => onChange(colour.key)}
            className={cn(
              "size-9 rounded-full border bg-cover bg-center transition-[box-shadow,border-color]",
              "focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
              active
                ? "border-brand-black/25 ring-2 ring-brand-black ring-offset-2"
                : "border-brand-black/20 hover:border-brand-black/45 active:border-brand-black/45",
            )}
            // The photograph when there is one, the flat colour when there is
            // not — the same fallback the drawing itself uses.
            style={{
              backgroundColor: colour.hex,
              backgroundImage: colour.texture ? `url(${colour.texture})` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
