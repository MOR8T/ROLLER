"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_CLICK_SCALE = 2.5;
const BUTTON_ZOOM_STEP = 0.5;
const WHEEL_ZOOM_SPEED = 0.0015;

interface Point {
  x: number;
  y: number;
}

interface ViewState {
  scale: number;
  offset: Point;
}

const RESET_VIEW: ViewState = { scale: MIN_SCALE, offset: { x: 0, y: 0 } };

/**
 * Chrome labels, so the same viewer can serve the localised storefront and the
 * Russian-only admin panel. The defaults are the admin's copy: `/admin` sits
 * outside `[locale]` and has no `next-intl` provider, so it cannot pass any.
 * Public callers pass the `lightbox` namespace in (see `CertificatesGallery`).
 */
export interface ImageLightboxLabels {
  close: string;
  view: string;
  zoomOut: string;
  zoomIn: string;
}

const DEFAULT_LABELS: ImageLightboxLabels = {
  close: "Закрыть",
  view: "Просмотр фотографии",
  zoomOut: "Уменьшить",
  zoomIn: "Увеличить",
};

export interface ImageLightboxProps {
  /** The open photo, or `null` to keep the viewer closed. */
  src: string | null;
  alt?: string;
  onClose: () => void;
  labels?: ImageLightboxLabels;
}

/**
 * Full-screen photo viewer with zoom and pan — a drop-in for anywhere a
 * thumbnail deserves a proper look, not just this one admin section.
 * Controlled: mount it once per gallery/list and flip `src` from whichever
 * thumbnail's own `onClick`; `null` keeps it closed and out of the DOM.
 *
 * Zoom: scroll wheel or double-click/tap (both toward the point under the
 * cursor), pinch on touch, or the +/- buttons — up to 4×. Pan by dragging
 * once zoomed past 1×.
 */
export function ImageLightbox({
  src,
  alt = "",
  onClose,
  labels = DEFAULT_LABELS,
}: ImageLightboxProps) {
  const prefersReducedMotion = useReducedMotion();
  const open = src !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="lightbox-backdrop"
          className="fixed inset-0 z-100 flex items-center justify-center bg-brand-black/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <button
            type="button"
            aria-label={labels.close}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full bg-brand-white/10 text-brand-white transition-colors hover:bg-brand-white/20 focus-visible:ring-2 focus-visible:ring-brand-white focus-visible:outline-none active:bg-brand-white/30"
          >
            <X className="size-5" />
          </button>

          {/* Keyed by `src`: a fresh photo remounts this instead of reusing
              stale zoom/pan state via an effect. */}
          <ZoomablePhoto
            key={src}
            src={src}
            alt={alt}
            labels={labels}
            reducedMotion={!!prefersReducedMotion}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function ZoomablePhoto({
  src,
  alt,
  labels,
  reducedMotion,
}: {
  src: string | null;
  alt: string;
  labels: ImageLightboxLabels;
  reducedMotion: boolean;
}) {
  const [view, setView] = useState<ViewState>(RESET_VIEW);
  const [isInteracting, setIsInteracting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activePointers = useRef(new Map<number, Point>());
  const pinch = useRef<{ distance: number; scale: number; mid: Point } | null>(null);
  const drag = useRef<{ start: Point; origin: Point } | null>(null);

  function clampOffset(scale: number, offset: Point): Point {
    const container = containerRef.current;
    if (!container || scale <= MIN_SCALE) return { x: 0, y: 0 };

    const rect = container.getBoundingClientRect();
    const maxX = (rect.width * (scale - 1)) / 2;
    const maxY = (rect.height * (scale - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, offset.x)),
      y: Math.max(-maxY, Math.min(maxY, offset.y)),
    };
  }

  /** Zooms to `nextScale`, keeping the point under `(clientX, clientY)` still. */
  function zoomAt(clientX: number, clientY: number, nextScale: number) {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const focusX = clientX - rect.left - rect.width / 2;
    const focusY = clientY - rect.top - rect.height / 2;

    setView((prev) => {
      const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, nextScale));
      if (scale === MIN_SCALE) return RESET_VIEW;

      const ratio = scale / prev.scale;
      const offset = {
        x: (prev.offset.x - focusX) * ratio + focusX,
        y: (prev.offset.y - focusY) * ratio + focusY,
      };
      return { scale, offset: clampOffset(scale, offset) };
    });
  }

  function zoomAtCenter(nextScale: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, nextScale);
  }

  function onWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    zoomAt(event.clientX, event.clientY, view.scale * (1 - event.deltaY * WHEEL_ZOOM_SPEED));
  }

  function onDoubleClick(event: MouseEvent<HTMLDivElement>) {
    if (view.scale > MIN_SCALE) setView(RESET_VIEW);
    else zoomAt(event.clientX, event.clientY, DOUBLE_CLICK_SCALE);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    // Capture is the nicety, not the mechanism — it throws `InvalidPointerId`
    // if the pointer is already gone, and an uncaught exception here would
    // abort the rest of this handler, silently dropping the drag/pinch that
    // follows. Same pitfall as `ExpoSlider`'s own pointer handling.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // no capture; the gesture still tracks while the pointer stays over the viewer
    }
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 2) {
      const [a, b] = Array.from(activePointers.current.values());
      pinch.current = {
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        scale: view.scale,
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      };
      drag.current = null;
      setIsInteracting(true);
    } else if (activePointers.current.size === 1 && view.scale > MIN_SCALE) {
      drag.current = { start: { x: event.clientX, y: event.clientY }, origin: view.offset };
      setIsInteracting(true);
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!activePointers.current.has(event.pointerId)) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(activePointers.current.values());
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomAt(
        pinch.current.mid.x,
        pinch.current.mid.y,
        pinch.current.scale * (distance / pinch.current.distance),
      );
      return;
    }

    if (drag.current) {
      const { start, origin } = drag.current;
      setView((prev) => ({
        ...prev,
        offset: clampOffset(prev.scale, {
          x: origin.x + (event.clientX - start.x),
          y: origin.y + (event.clientY - start.y),
        }),
      }));
    }
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(event.pointerId);
    if (activePointers.current.size < 2) pinch.current = null;
    if (activePointers.current.size === 0) {
      drag.current = null;
      setIsInteracting(false);
    }
  }

  return (
    <>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={alt || labels.view}
        className={cn(
          "relative h-full w-full touch-none overflow-hidden p-6 sm:p-12",
          view.scale > MIN_SCALE
            ? isInteracting
              ? "cursor-grabbing"
              : "cursor-grab"
            : "cursor-zoom-in",
        )}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {/* The entrance pop lives on this wrapper, animated by framer-motion
            once on mount. The live zoom/pan transform below has to be a
            plain, imperatively-driven `<img>` instead of `motion.img` —
            framer-motion owns `transform` on anything it animates and
            overwrites a hand-set `style.transform` on every render, which is
            exactly the bug this split avoids. */}
        <motion.div
          initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="h-full w-full"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src ?? undefined}
            alt={alt}
            draggable={false}
            style={{
              transform: `translate(${view.offset.x}px, ${view.offset.y}px) scale(${view.scale})`,
              transition: isInteracting ? "none" : "transform 0.2s ease-out",
            }}
            className="mx-auto h-full w-full object-contain select-none"
          />
        </motion.div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-brand-black/50 p-1 backdrop-blur-sm">
        <button
          type="button"
          aria-label={labels.zoomOut}
          disabled={view.scale <= MIN_SCALE}
          onClick={() => zoomAtCenter(view.scale - BUTTON_ZOOM_STEP)}
          className="grid size-9 place-items-center rounded-full text-brand-white transition-colors hover:bg-brand-white/15 focus-visible:ring-2 focus-visible:ring-brand-white focus-visible:outline-none active:bg-brand-white/25 disabled:pointer-events-none disabled:opacity-40"
        >
          <ZoomOut className="size-4" />
        </button>
        <span className="min-w-11 text-center text-xs font-medium text-brand-white tabular-nums">
          {Math.round(view.scale * 100)}%
        </span>
        <button
          type="button"
          aria-label={labels.zoomIn}
          disabled={view.scale >= MAX_SCALE}
          onClick={() => zoomAtCenter(view.scale + BUTTON_ZOOM_STEP)}
          className="grid size-9 place-items-center rounded-full text-brand-white transition-colors hover:bg-brand-white/15 focus-visible:ring-2 focus-visible:ring-brand-white focus-visible:outline-none active:bg-brand-white/25 disabled:pointer-events-none disabled:opacity-40"
        >
          <ZoomIn className="size-4" />
        </button>
      </div>
    </>
  );
}
