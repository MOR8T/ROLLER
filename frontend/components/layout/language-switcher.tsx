"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { defaultLocale, locales, type Locale } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Language Switcher
 *
 * Dropdown component for switching between locales (RU/TJ/EN/TR).
 * Displays the current language code and opens a dropdown menu to select a different language.
 *
 * No routing logic — locale switching routes handled in Stage 07 (i18n).
 * Supports both desktop and mobile layouts, responsive to solid/transparent states.
 */
interface LanguageSwitcherProps {
  solid: boolean;
}

// Map locale codes to display labels
const localeLabels: Record<Locale, string> = {
  ru: "Русский",
  tg: "Таджикский",
  en: "English",
  tr: "Türkçe",
};

export function LanguageSwitcher({ solid }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase transition-colors",
          solid
            ? "border-brand-black/10 text-brand-black hover:bg-brand-black/5"
            : "border-brand-white/25 text-brand-white hover:bg-brand-white/10",
        )}
      >
        <span>{defaultLocale.toUpperCase()}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-1 min-w-max overflow-hidden rounded-lg border shadow-lg transition-opacity",
            solid
              ? "border-brand-black/15 bg-brand-white"
              : "border-brand-white/25 bg-brand-black/95",
          )}
        >
          <ul role="listbox" className="py-1">
            {locales.map((locale: Locale) => (
              <li key={locale}>
                <button
                  type="button"
                  role="option"
                  aria-selected={locale === defaultLocale}
                  onClick={() => {
                    // Locale switching logic will be handled in Stage 07
                    setIsOpen(false);
                  }}
                  className={cn(
                    "block w-full px-4 py-2 text-left text-sm font-medium transition-colors",
                    locale === defaultLocale
                      ? solid
                        ? "bg-brand-red text-brand-white"
                        : "bg-brand-red text-brand-white"
                      : solid
                        ? "text-brand-black/70 hover:bg-brand-black/5 hover:text-brand-red"
                        : "text-brand-white/75 hover:bg-brand-white/10 hover:text-brand-white",
                  )}
                >
                  {localeLabels[locale]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
