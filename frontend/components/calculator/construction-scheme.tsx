"use client";

import { useEffect, useId, useState } from "react";

import { schemeUrl, textureUrl, type LaminationKey, type Scheme } from "@/data/calculator";
import { cn } from "@/lib/utils";

/**
 * The construction as a drawing — the big scheme in the middle of a position.
 *
 * It is the client's own file from `public/cal/`, not a redrawing of it: the
 * same SVG the thumbnail shows, fetched and inlined so its parts can be
 * coloured. On top of that drawing go the two choices a line drawing cannot
 * otherwise carry — the lamination, laid under the profile, and the hardware
 * colour, on the handles and hinges.
 *
 * Which paths are hardware, and which are the variant number stamped in the
 * corner, is decided once by `scripts/parse-calculator-schemes.py` and travels
 * as indices into the file's own path order. So nothing here parses geometry;
 * it fetches, indexes and paints.
 */

/** Height ÷ width of the mirrored lamination tiles in `public/cal/textures/`. */
const TEXTURE_ASPECT = 0.36;

const INK = "#333436";
const OPENING = "#D91C2B";
const GLASS = "#f7fafc";

/** Hardware colours reuse the lamination swatches — the client's own palette. */
const HARDWARE_FILL: Record<LaminationKey, string> = {
  white: "#f2f2f0",
  anthracite: "#313948",
  nut: "#734520",
  "golden-oak": "#9f520e",
  "dark-oak": "#574831",
};

interface DrawnPath {
  d: string;
  fill: string | null;
  stroke: string | null;
}

const PATH_RE = /<path\b([^>]*)\/>/g;
const ATTR_RE = /([\w:-]+)="([^"]*)"/g;

const drawings = new Map<string, DrawnPath[] | Promise<DrawnPath[]>>();

/**
 * The drawing's paths, in file order — the order the role indices count in.
 *
 * Cached across positions and across variant switches, and warm before it is
 * ever asked for: the same URL is already in the browser's cache from the
 * thumbnail in the picker above.
 */
function drawingOf(url: string): DrawnPath[] | Promise<DrawnPath[]> {
  const hit = drawings.get(url);
  if (hit) return hit;

  const pending = fetch(url)
    .then((response) => response.text())
    .then((source) => {
      const paths: DrawnPath[] = [];
      for (const [, raw] of source.matchAll(PATH_RE)) {
        const attrs = new Map([...raw.matchAll(ATTR_RE)].map(([, key, value]) => [key, value]));
        paths.push({
          d: attrs.get("d") ?? "",
          fill: attrs.get("fill") ?? null,
          stroke: attrs.get("stroke") ?? null,
        });
      }
      drawings.set(url, paths);
      return paths;
    });

  drawings.set(url, pending);
  return pending;
}

interface ConstructionSchemeProps {
  scheme: Scheme;
  lamination: LaminationKey;
  hardware: LaminationKey;
  title?: string;
  className?: string;
}

export function ConstructionScheme({
  scheme,
  lamination,
  hardware,
  title,
  className,
}: ConstructionSchemeProps) {
  const uid = useId().replace(/:/g, "");
  const url = schemeUrl(scheme);
  const [, redraw] = useState(0);

  // The effect only starts the fetch and asks for a repaint when it lands; the
  // paths themselves are read from the module cache during render, so a variant
  // that has already been drawn once appears without a frame of placeholder.
  useEffect(() => {
    const drawing = drawingOf(url);
    if (Array.isArray(drawing)) return;
    let live = true;
    drawing.then(() => {
      if (live) redraw((tick) => tick + 1);
    });
    return () => {
      live = false;
    };
  }, [url]);

  const cached = drawings.get(url);
  const paths = Array.isArray(cached) ? cached : null;

  // The sliders do not touch the drawing. A scheme is a drawing of a *type* of
  // construction, not a scale elevation of one, and stretching it to 3000 × 400
  // would draw stiles half a metre thick — so the millimetres stay where they
  // belong, on the readouts and in the request.
  //
  // `non-scaling-stroke` measures the pen in screen pixels, not in viewBox
  // units, so the line weight is written here as the weight it should look.
  const hairline = 1.15;

  // The pattern is keyed by the colour, not just by the component: swapping the
  // `href` inside a live `<pattern>` leaves Chrome painting the old tile, and a
  // configurator whose lamination silently does not change is worse than none.
  const lam = `lam-${uid}-${lamination}`;
  const span = Math.max(scheme.vw, scheme.vh);

  const { arch } = scheme;
  const head = arch
    ? [
        arch.box[0] - scheme.profile,
        Math.max(arch.box[1] - scheme.profile, 0),
        arch.box[2] + scheme.profile,
        arch.spring,
      ]
    : null;

  return (
    <svg
      viewBox={`0 0 ${scheme.vw} ${scheme.vh}`}
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* One tile across the drawing's long side, so grain reads the same on
            a narrow casement and on a five-sash run. */}
        <pattern id={lam} patternUnits="userSpaceOnUse" width={span} height={span * TEXTURE_ASPECT}>
          <image
            href={textureUrl(lamination)}
            width={span}
            height={span * TEXTURE_ASPECT}
            preserveAspectRatio="none"
          />
        </pattern>

        {/* The silhouette of the construction. The lamination is clipped to it,
            or the square corners above an arched head fill in with timber. */}
        <clipPath id={`body-${uid}`}>
          <rect
            x={0}
            y={arch ? arch.spring : 0}
            width={scheme.vw}
            height={scheme.vh - (arch ? arch.spring : 0)}
          />
          {arch && head ? (
            <path
              d={`${arch.d} L${arch.box[2]} ${arch.spring} L${arch.box[0]} ${arch.spring} Z`}
              transform={arcTransform(arch.box, arch.spring, head)}
            />
          ) : null}
        </clipPath>
      </defs>

      <g>
        <rect
          x={0}
          y={0}
          width={scheme.vw}
          height={scheme.vh}
          fill={`url(#${lam})`}
          clipPath={`url(#body-${uid})`}
        />

        {/* Glazing, so the lamination stops at the rebate. */}
        {scheme.panes.map((pane, index) => (
          <rect
            key={index}
            x={pane.box[0]}
            y={pane.box[1]}
            width={pane.box[2] - pane.box[0]}
            height={pane.box[3] - pane.box[1]}
            fill={GLASS}
          />
        ))}
        {arch ? (
          <path
            d={`${arch.d} L${arch.box[2]} ${arch.foot} L${arch.box[0]} ${arch.foot} Z`}
            fill={GLASS}
          />
        ) : null}

        {paths ? (
          paths.map((path, index) => {
            if (scheme.roles.label.includes(index)) return null;
            const isHardware = scheme.roles.hardware.includes(index);
            const isOpening = path.stroke === OPENING;

            return (
              <path
                key={index}
                d={path.d}
                fill={
                  isHardware
                    ? HARDWARE_FILL[hardware]
                    : path.fill === "white"
                      ? "none"
                      : (path.fill ?? "none")
                }
                stroke={isOpening ? OPENING : INK}
                strokeWidth={isOpening ? hairline * 0.85 : hairline}
                vectorEffect="non-scaling-stroke"
              />
            );
          })
        ) : (
          // Until the file is in hand, the drawing itself stands in — same
          // pixels, minus the colouring.
          <image href={url} width={scheme.vw} height={scheme.vh} preserveAspectRatio="none" />
        )}
      </g>
    </svg>
  );
}

/** Fits the drawing's own arc into a target box, as a transform. */
function arcTransform(box: number[], spring: number, to: number[]): string {
  const sx = (to[2] - to[0]) / Math.max(box[2] - box[0], 0.01);
  const sy = (to[3] - to[1]) / Math.max(spring - box[1], 0.01);
  return `translate(${to[0] - box[0] * sx} ${to[1] - box[1] * sy}) scale(${sx} ${sy})`;
}
