import { defineRouting } from "next-intl/routing";

/**
 * Routing contract for the whole site — the decisions here are fixed by
 * `project_plan/03-i18n-foundation.md` and are not revisited per page.
 *
 * `localePrefix: "always"`. The alternative, `as-needed`, leaves the default
 * locale unprefixed and so gives the homepage two addresses (`/` and `/ru`).
 * SEO is a stated goal of the project, and duplicate entry points are the one
 * thing that costs there for free.
 *
 * No `pathnames` map: slugs stay identical Latin across all four locales. The
 * product slugs are brand names — `roller`, `stella`, `unopen`, `thermo-60` —
 * and a brand name does not translate into Tajik, English or Turkish.
 */
export const routing = defineRouting({
  locales: ["ru", "tj", "en", "tr"],
  defaultLocale: "ru",
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];

export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
