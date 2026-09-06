"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The site's slider step button.
 *
 * Shared by `expo-slider.tsx` and `home-carousel.tsx` so the hero deck and the
 * homepage strips step with the same control instead of two copies that drift
 * apart the first time one of them is touched.
 *
 * `overlay` is the variant that sits *on* a photograph — solid white on the
 * image, no border to fight the picture's own edge. The default is the one that
 * sits under the deck on the page background, where a border is what gives it a
 * shape at all.
 */
export function SliderArrow({
  side,
  label,
  overlay = false,
  disabled = false,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  overlay?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-default disabled:opacity-40",
        overlay
          ? "size-12 bg-white text-black shadow-[0_4px_16px_rgba(0,0,0,0.16)] hover:bg-black hover:text-white focus-visible:ring-black active:bg-black active:text-white"
          : "size-11 border border-brand-black/15 bg-brand-white text-brand-black hover:border-brand-black/45 focus-visible:ring-brand-black active:border-brand-black/45",
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
