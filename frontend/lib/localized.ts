import { defaultLocale, locales, type Locale } from "@/i18n/routing";

/**
 * Text carried in all four locales at once.
 *
 * ⚠️ This is the exception on the site, not the rule. Everywhere else a
 * component asks `useTranslations` for the *current* locale and never sees the
 * others — that is what `next-intl` is for. The product page is built the other
 * way round on the client's instruction: one state object holds the whole page,
 * and every string inside it carries every locale (`{ru, tg, en, tr}`), so the
 * sections receive data rather than translation keys.
 *
 * Nothing else may adopt this shape without the same instruction: four
 * catalogues shipped to the browser instead of one is a real cost. It is not
 * paid here — this module holds only the type and the readers, and the
 * catalogues themselves stay behind `lib/localized-messages.ts`, which only the
 * server imports.
 */
export type LocalizedText = Record<Locale, string>;

/** A `Spec`-shaped pair with both halves localised. */
export interface LocalizedPair {
  name: LocalizedText;
  value: LocalizedText;
}

/**
 * A value that is the same in every language — a count, a code, a brand name
 * typed out. Wrapped rather than special-cased, so the section still receives a
 * `LocalizedText` and never has to ask which kind of string it is holding.
 */
export function localizedConstant(value: string | number): LocalizedText {
  return Object.fromEntries(locales.map((locale) => [locale, String(value)])) as LocalizedText;
}

/**
 * Several localised strings joined per locale — «Окна · ПВХ».
 *
 * Joining the *rendered* strings instead would need the locale, and the whole
 * point of the page data is that it is assembled before anyone knows which
 * locale is reading it.
 */
export function joinLocalized(parts: LocalizedText[], separator = " · "): LocalizedText {
  return Object.fromEntries(
    locales.map((locale) => [
      locale,
      parts
        .map((part) => part[locale])
        .filter(Boolean)
        .join(separator),
    ]),
  ) as LocalizedText;
}

/** The half of a `LocalizedText` this request is reading. */
export function localized(text: LocalizedText | undefined, locale: Locale): string {
  if (!text) return "";
  return text[locale] || text[defaultLocale];
}
