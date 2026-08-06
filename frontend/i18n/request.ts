import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Corresponds to the `[locale]` segment. `hasLocale` narrows `string` to a
  // supported locale; the layout separately calls `notFound()` for anything
  // else, so the default here only covers requests that never reach a page
  // (metadata resolution, error boundaries).
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,

    // No fallback chain — a missing translation renders empty rather than
    // leaking the key or silently showing Russian to a Turkish visitor
    // (plan §"Решения, которые не пересматриваются"). The default `onError`
    // still logs the miss, so an empty slot is loud in the console, not silent.
    getMessageFallback: () => "",
  };
});
