export type ClassValue = string | number | null | false | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * True for targets that must never gain a locale prefix: other origins
 * (`https://wa.me/…`), other schemes (`tel:`, `mailto:`) and same-page
 * fragments (`#brands`). Everything else is an internal route and has to go
 * through `@/i18n/navigation`.
 */
export function isExternalHref(href: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(href);
}
