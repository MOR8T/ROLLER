"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { defaultLocale, locales, type Locale } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Language Switcher
 *
 * Dropdown component for switching between locales (RU/TJ/EN/TR).
 * Displays the current language code and opens a dropdown menu to select a different language.
 *
 * No routing logic — locale switching routes handled in Stage 03 (i18n).
 */
// Map locale codes to display labels
const localeLabels: Record<Locale, string> = {
  ru: "Русский",
  tg: "Тоҷикӣ",
  en: "English",
  tr: "Türkçe",
};

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close on Escape and on outside click/tap so keyboard and pointer users
  // can dismiss the menu without committing a selection.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const onPointer = (event: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
    };
  }, [isOpen]);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-control border border-brand-black/10 px-3 py-1.5 text-xs font-semibold text-brand-black uppercase transition-colors hover:bg-brand-black/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span>{defaultLocale.toUpperCase()}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-max overflow-hidden rounded-card border border-brand-black/15 bg-brand-white shadow-lg transition-opacity">
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
                    "block w-full px-4 py-2 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:outline-none focus-visible:ring-inset",
                    locale === defaultLocale
                      ? "bg-brand-red text-brand-white"
                      : "text-brand-black/70 hover:bg-brand-black/5 hover:text-brand-red",
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
