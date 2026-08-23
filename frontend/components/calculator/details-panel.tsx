"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import { Select } from "@/components/ui/select";
import {
  MAX_QUANTITY,
  accessoriesFor,
  glazingOf,
  hardwareColors,
  laminations,
  materials,
  mechanisms,
  systemsFor,
  textureUrl,
  type AccessoryKey,
  type ConfiguredItem,
  type LaminationKey,
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
  onChange,
}: {
  item: ConfiguredItem;
  onChange: (patch: Partial<ConfiguredItem>) => void;
}) {
  const t = useTranslations("calculator");
  const tBrands = useTranslations("brands");
  const tColors = useTranslations("colors");
  const uid = useId();

  const series = systemsFor(item.construction, item.material);
  const glazing = glazingOf(item.system);
  const extras = accessoriesFor(item.construction);

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
                    : "border-brand-black/20 bg-surface text-brand-black hover:border-brand-black/45",
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
          {series.map((product) => (
            <option key={product.slug} value={product.slug}>
              {tBrands(`items.${product.slug}.name`)}
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
          onChange={(event) =>
            onChange({ mechanism: event.target.value as ConfiguredItem["mechanism"] })
          }
        >
          {mechanisms.map((key) => (
            <option key={key} value={key}>
              {t(`mechanisms.${key}`)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={t("labels.lamination")}>
        <Swatches
          options={laminations}
          value={item.lamination}
          onChange={(lamination) => onChange({ lamination })}
          name={(key) => tColors(key)}
        />
      </Field>

      <Field label={t("labels.hardware")}>
        <Swatches
          options={hardwareColors}
          value={item.hardware}
          onChange={(hardware) => onChange({ hardware })}
          name={(key) => tColors(key)}
        />
      </Field>

      {extras.length > 0 ? (
        <Field label={t("labels.accessories")}>
          <div className="space-y-2.5">
            {extras.map((key: AccessoryKey) => {
              const checked = item.accessories.includes(key);
              return (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-3 text-sm text-brand-black/80"
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
                  {t(`accessories.${key}`)}
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
  name,
}: {
  options: readonly LaminationKey[];
  value: LaminationKey;
  onChange: (key: LaminationKey) => void;
  name: (key: LaminationKey) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2.5">
      {options.map((key) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={active}
            title={name(key)}
            aria-label={name(key)}
            onClick={() => onChange(key)}
            className={cn(
              "size-9 rounded-full border bg-cover bg-center transition-[box-shadow,border-color]",
              "focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
              active
                ? "border-brand-black/25 ring-2 ring-brand-black ring-offset-2"
                : "border-brand-black/20 hover:border-brand-black/45",
            )}
            style={{ backgroundImage: `url(${textureUrl(key)})` }}
          />
        );
      })}
    </div>
  );
}
