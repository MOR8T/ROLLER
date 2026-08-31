"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { locales, type Locale } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";

/**
 * A four-language text field, as a *controlled* group.
 *
 * ⚠️ Not the same thing as the `name_ru`/`name_tj`/… inputs the other admin
 * managers use. Those forms post `FormData` and let the browser collect the
 * values; the product sections post JSON with nested arrays in it — a spec
 * table, a list of paragraphs, a palette — so the values have to live in React
 * state, and every localised string inside them is one of these.
 *
 * The API rejects a blank translation (all four are required), and `required`
 * here is what stops the form before the round trip.
 */

export type LocalizedValue = Record<Locale, string>;

export const EMPTY_LOCALIZED: LocalizedValue = { ru: "", tj: "", en: "", tr: "" };

/** Reads a stored payload's `{ru, tj, en, tr}` back into form state. */
export function toLocalizedValue(value: unknown): LocalizedValue {
  const source = (value ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    locales.map((locale) => [locale, String(source[locale] ?? "")]),
  ) as LocalizedValue;
}

export function isLocalizedFilled(value: LocalizedValue): boolean {
  return locales.every((locale) => value[locale].trim().length > 0);
}

export function LocalizedFields({
  label,
  hint,
  value,
  onChange,
  disabled,
  multiline = false,
  required = true,
}: {
  label: string;
  hint?: string;
  value: LocalizedValue;
  onChange: (next: LocalizedValue) => void;
  disabled?: boolean;
  /** Paragraphs and descriptions get a textarea; titles and labels an input. */
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-brand-black">{label}</p>
      {hint ? <p className="mb-2 text-xs text-neutral-500">{hint}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {locales.map((locale) => {
          const id = `${label}-${locale}`;
          const common = {
            id,
            value: value[locale],
            required,
            disabled,
            onChange: (event: { target: { value: string } }) =>
              onChange({ ...value, [locale]: event.target.value }),
          };

          return (
            <div key={locale}>
              <label
                htmlFor={id}
                className="mb-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500 uppercase"
              >
                {locale}
                <span className="font-normal text-neutral-400 normal-case">
                  · {localeLabels[locale]}
                </span>
              </label>
              {multiline ? <Textarea rows={3} {...common} /> : <Input {...common} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
