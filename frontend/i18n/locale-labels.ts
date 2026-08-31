import type { Locale } from "@/i18n/routing";

/**
 * Every language's own name for itself — a Turkish visitor looking for their
 * language is looking for "Türkçe", not its Russian name. Shared by the
 * public language switcher (`components/layout/language-switcher.tsx`) and
 * the admin panel's per-locale content forms (e.g. hero slide titles), so
 * the two never drift into different labels for the same four locales.
 */
export const localeLabels: Record<Locale, string> = {
  ru: "Русский",
  tj: "Тоҷикӣ",
  en: "English",
  tr: "Türkçe",
};
