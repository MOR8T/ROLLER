"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MediaFrame } from "@/components/ui/media-frame";
import { colorSwatches } from "@/data/catalog";
import { cn } from "@/lib/utils";
import type { Colorway } from "@/types";

/**
 * The product gallery: lamination colour across, camera angle along.
 *
 * That shape is the client's own — the renders arrive as a folder per colour
 * holding several angles of one and the same construction
 * (`project_plan/05-product-page.md`) — and it is the reason this is one
 * component rather than a colour picker beside a carousel. Picking a colour has
 * to swap the whole strip of angles, not scrub to an unrelated picture.
 *
 * Swiping is the browser's: the strip is a scroll-snap track, so touch gets the
 * real thing (momentum, rubber-band, no 300 ms tap delay) for no bytes, and the
 * arrows and thumbnails drive the same `scrollTo`. `swiper` is in
 * `package.json` and deliberately not used here — DESIGN.md §8 reserves JS
 * motion for genuine interaction, and a horizontal list of images is not it.
 *
 * The one piece of state that cannot be native is which angle is showing: it is
 * read back off `scrollLeft` so the counter and thumbnails stay right whether
 * the visitor swiped, clicked or tabbed.
 */

interface ProductGalleryProps {
  name: string;
  gallery: Colorway[];
  /** Rendered when the client has sent no renders at all — ЭКОЛАЙН. */
  placeholder: string;
}

export function ProductGallery({ name, gallery, placeholder }: ProductGalleryProps) {
  const t = useTranslations("product");
  const tColors = useTranslations("colors");

  const [colorIndex, setColorIndex] = useState(0);
  const [angle, setAngle] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  if (gallery.length === 0) {
    return (
      <MediaFrame
        src={null}
        alt={name}
        placeholderLabel={placeholder}
        width={4}
        height={3}
        containerClassName="rounded-card"
      />
    );
  }

  const colorway = gallery[Math.min(colorIndex, gallery.length - 1)];
  const images = colorway.images;

  function scrollToAngle(next: number) {
    const element = track.current;
    if (!element) return;

    const clamped = Math.max(0, Math.min(next, images.length - 1));
    element.scrollTo({ left: clamped * element.clientWidth, behavior: "smooth" });
    setAngle(clamped);
  }

  function selectColor(next: number) {
    setColorIndex(next);
    setAngle(0);
    // Jump rather than glide: this is a different construction, and animating
    // sideways through angles that belong to another colour reads as a bug.
    track.current?.scrollTo({ left: 0, behavior: "instant" });
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-card border border-brand-black/10 bg-surface-muted">
        <div
          ref={track}
          role="group"
          aria-label={t("gallery.aria", { name })}
          onScroll={(event) => {
            const element = event.currentTarget;
            setAngle(Math.round(element.scrollLeft / element.clientWidth));
          }}
          className="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, index) => (
            <div key={src} className="w-full shrink-0 snap-center p-6 sm:p-10">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={src}
                  alt={t("imageAlt", { name, color: tColors(colorway.color) })}
                  fill
                  className="object-contain"
                  // The gallery is the largest image slot on the site: full
                  // width up to `--container-page` (80rem), then a hair over
                  // half of it once the summary column appears at `lg`.
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 45vw"
                  // Only the opening frame is LCP-eligible; the rest of the
                  // strip is off-screen and must not compete for bandwidth.
                  priority={index === 0 && colorIndex === 0}
                />
              </div>
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <>
            <GalleryArrow
              side="left"
              label={t("gallery.previous")}
              disabled={angle === 0}
              onClick={() => scrollToAngle(angle - 1)}
            />
            <GalleryArrow
              side="right"
              label={t("gallery.next")}
              disabled={angle === images.length - 1}
              onClick={() => scrollToAngle(angle + 1)}
            />
          </>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div
          role="group"
          aria-label={t("gallery.angles")}
          className="mt-3 flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-label={t("gallery.angle", { index: index + 1 })}
              aria-current={index === angle}
              onClick={() => scrollToAngle(index)}
              className={cn(
                "relative size-16 shrink-0 overflow-hidden rounded-control border bg-surface-muted transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none sm:size-20",
                index === angle
                  ? "border-brand-black"
                  : "border-brand-black/10 hover:border-brand-red/40",
              )}
            >
              <Image src={src} alt="" fill className="object-contain p-1.5" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}

      {gallery.length > 1 ? (
        <fieldset className="mt-6">
          <legend className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase">
            {t("gallery.colors")}
          </legend>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {gallery.map((item, index) => (
              <button
                key={item.color}
                type="button"
                aria-pressed={index === colorIndex}
                onClick={() => selectColor(index)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-control border py-1.5 pr-3.5 pl-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                  index === colorIndex
                    ? "border-brand-black bg-brand-black text-brand-white"
                    : "border-brand-black/15 bg-surface text-brand-black/75 hover:border-brand-red/50 hover:text-brand-red",
                )}
              >
                <span
                  aria-hidden
                  // A dot, so `rounded-full` is allowed here — DESIGN.md §5
                  // rules out pills for buttons, not for indicators.
                  className="size-4 shrink-0 rounded-full border border-brand-black/20"
                  style={{ backgroundColor: colorSwatches[item.color] }}
                />
                {tColors(item.color)}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}

function GalleryArrow({
  side,
  label,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  disabled: boolean;
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
        // Hidden on touch, where the track itself is the control. `sm:` rather
        // than a pointer query because the arrows also need to be there for a
        // narrow desktop window with a mouse.
        "absolute top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand-black/10 bg-surface/90 text-brand-black shadow-sm transition-opacity hover:bg-surface focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-0 sm:flex",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
