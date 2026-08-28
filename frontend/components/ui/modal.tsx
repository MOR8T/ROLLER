"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Generic centered dialog — same overlay/panel/escape/scroll-lock as `RequestModal`. */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
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
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "relative w-full max-w-md rounded-card bg-surface p-5 shadow-2xl outline-none sm:p-8",
          className,
        )}
      >
        <button
          type="button"
          aria-label="Закрыть"
          onClick={onClose}
          className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-control text-brand-black/50 transition-colors hover:bg-brand-black/5 hover:text-brand-black focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:outline-none"
        >
          <X className="size-5" aria-hidden />
        </button>

        <h2 className="font-heading text-xl font-semibold text-brand-black">{title}</h2>

        {children}
      </div>
    </div>
  );
}
