import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import tj from "@/messages/tj.json";
import tr from "@/messages/tr.json";
import type { LocalizedPair, LocalizedText } from "@/lib/localized";

/**
 * Reading the message catalogues *all four at once*, for the one page that
 * holds its copy as data instead of asking `next-intl` for the current locale.
 *
 * ⚠️ Server-side only. Importing this module from a client component pulls all
 * four catalogues — a quarter of a megabyte of JSON — into the browser bundle,
 * which is exactly why `localized()` and the `LocalizedText` type live in
 * `lib/localized.ts` and nothing in `components/` imports this file.
 */

const catalogues: Record<Locale, unknown> = { ru, tj, en, tr };

function resolve(catalogue: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => {
    if (node && typeof node === "object") return (node as Record<string, unknown>)[key];
    return undefined;
  }, catalogue);
}

/**
 * `{name}` substitution, the same placeholder syntax the catalogues already
 * use. ICU plurals (`{count, plural, …}`) are *not* supported and no key that
 * uses one may be read through here — the page data holds a label and a number
 * as two fields instead, which is what the spec rows want anyway.
 */
function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/**
 * One message key, read out of all four catalogues.
 *
 * A variable may itself be localised — the product name is not, the category
 * title is — so `vars` accepts both a plain value and a `LocalizedText`, and
 * the right half is picked per locale.
 */
export function localizedText(
  path: string,
  vars: Record<string, string | number | LocalizedText> = {},
): LocalizedText {
  const entries = locales.map((locale) => {
    const template = resolve(catalogues[locale], path);
    if (typeof template !== "string") {
      // A key missing from a translation is a content bug, not a crash: the
      // Russian catalogue is the one that is always complete, so it stands in.
      const fallback = resolve(catalogues[defaultLocale], path);
      return [locale, typeof fallback === "string" ? fallback : path] as const;
    }

    const resolved = Object.fromEntries(
      Object.entries(vars).map(([key, value]) => [
        key,
        typeof value === "object" ? value[locale] : value,
      ]),
    ) as Record<string, string | number>;

    return [locale, interpolate(template, resolved)] as const;
  });

  return Object.fromEntries(entries) as LocalizedText;
}

/**
 * An array of `{name, value}` pairs — the spec tables in `products.items.*` —
 * zipped across the catalogues.
 *
 * The Russian array sets the length and the order: the four files were authored
 * row by row together, so index *is* the identity of a row. A translation that
 * is short a row falls back to the Russian text for that row rather than
 * shifting every row below it.
 */
export function localizedPairs(path: string): LocalizedPair[] {
  const source = resolve(catalogues[defaultLocale], path);
  if (!Array.isArray(source)) return [];

  return source.map((_, index) => ({
    name: localizedText(`${path}.${index}.name`),
    value: localizedText(`${path}.${index}.value`),
  }));
}
