"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

import { RequestForm } from "@/components/forms/request-form";

/**
 * The request, over the configurator.
 *
 * `imzo.uz` ends «Отправить» in a modal rather than a section further down the
 * page, and with up to eight positions open that is the right call: the summary
 * a visitor just built is what they are looking at, and scrolling away from it
 * to find a form loses the thread.
 */
export function RequestModal({
  open,
  onClose,
  summary,
  buildConfiguration,
}: {
  open: boolean;
  onClose: () => void;
  summary: string[];
  buildConfiguration: () => string | null;
}) {
  const t = useTranslations("calculator");
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", escape);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      document.removeEventListener("keydown", escape);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-black/60 p-4 py-10 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={t("request.title")}
        tabIndex={-1}
        className="relative w-full max-w-3xl rounded-card bg-surface p-5 shadow-2xl outline-none sm:p-8"
      >
        <button
          type="button"
          aria-label={t("request.close")}
          onClick={onClose}
          className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-control text-brand-black/50 transition-colors hover:bg-brand-black/5 hover:text-brand-black focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:outline-none active:bg-brand-black/10 active:text-brand-black"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2 className="font-heading text-2xl font-semibold text-brand-black">
          {t("request.title")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-brand-black/65">{t("request.description")}</p>

        <div className="mt-6 rounded-card border border-brand-black/10 bg-surface-muted p-4 sm:p-5">
          <h3 className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase">
            {t("summary.title")}
          </h3>
          <ol className="mt-3 space-y-2">
            {summary.map((line, index) => (
              <li key={index} className="text-sm leading-6 text-brand-black/75">
                {line}
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-5 text-brand-black/55">{t("noPrice")}</p>
        </div>

        <RequestForm
          className="mt-7"
          scenarios={["calculate", "quote"]}
          buildConfiguration={buildConfiguration}
        />
      </div>
    </div>
  );
}
