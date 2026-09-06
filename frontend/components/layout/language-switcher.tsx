"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const t = useTranslations("header");
  const activeLocale = useLocale() as Locale;
  const router = useRouter();
  // next-intl's `usePathname` returns the route *without* the locale prefix,
  // which is exactly what has to be preserved across the switch.
  const pathname = usePathname();

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

  function selectLocale(nextLocale: Locale) {
    setIsOpen(false);
    if (nextLocale === activeLocale) return;

    // Query string read from `window` rather than through `useSearchParams`:
    // the hook would mark the whole subtree dynamic and cost the layout its
    // static rendering, and this value is only ever needed inside a click.
    const search = window.location.search;

    startTransition(() => {
      router.replace(`${pathname}${search}`, { locale: nextLocale });
    });
  }

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t("languageSwitcher")}
        disabled={isPending}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-control border border-brand-black/10 px-3 py-1.5 text-xs font-semibold text-brand-black uppercase transition-colors hover:bg-brand-black/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none active:bg-brand-black/10 disabled:opacity-60"
      >
        <span>{activeLocale.toUpperCase()}</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 min-w-max overflow-hidden rounded-card border border-brand-black/15 bg-brand-white shadow-lg transition-opacity">
          <ul role="listbox" className="py-1">
            {locales.map((locale) => (
              <li key={locale}>
                <button
                  type="button"
                  role="option"
                  lang={locale}
                  aria-selected={locale === activeLocale}
                  onClick={() => selectLocale(locale)}
                  className={cn(
                    "block w-full px-4 py-2 text-left text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:outline-none focus-visible:ring-inset",
                    locale === activeLocale
                      ? "bg-brand-red text-brand-white"
                      : "text-brand-black/70 hover:bg-brand-black/5 hover:text-brand-red active:bg-brand-black/10 active:text-brand-red",
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
