"use client";

import { defaultLocale, locales, type Locale } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Language Switcher
 *
 * UI-only component for switching between RU/TJ/EN languages.
 * Highlights the default locale as active; others are inactive.
 *
 * No routing logic — locale switching routes handled in Stage 07 (i18n).
 * Supports both inline (desktop nav) and full-width (mobile) layouts via CSS.
 */
interface LanguageSwitcherProps {
  solid: boolean;
}

export function LanguageSwitcher({ solid }: LanguageSwitcherProps) {
  return (
    <div
      className={cn(
        "flex rounded-full border p-1",
        solid ? "border-brand-black/10" : "border-brand-white/25",
      )}
    >
      {locales.map((locale: Locale) => {
        const active = locale === defaultLocale;
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={active}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase transition-colors",
              active
                ? "bg-brand-black text-brand-white"
                : solid
                  ? "text-brand-black/55 hover:text-brand-red"
                  : "text-brand-white/65 hover:text-brand-white",
            )}
          >
            {locale}
          </button>
        );
      })}
    </div>
  );
}
