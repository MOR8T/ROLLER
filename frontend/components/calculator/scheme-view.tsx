"use client";

import { useId } from "react";

import {
  layoutScheme,
  defaultProfile,
  type ProfileWidths,
  type Rect,
  type SchemeGeometry,
  type SchemeLayout,
  type LaidOutPane,
} from "@/lib/scheme-geometry";
import { samePath } from "@/lib/scheme-edit";
import { cn } from "@/lib/utils";

/**
 * A construction drawn from declared geometry.
 *
 * It replaced a renderer that inlined the client's own SVG and painted its
 * paths. That one could not respond to the size sliders, because a drawing is
 * a picture of a *type* of construction, not an elevation of one. This one is
 * computed from `lib/scheme-geometry.ts`, so
 * the frame keeps a constant 60 mm at 600 mm and at 3000 mm and only the
 * glass stretches. A 3000x400 transom light finally reads as a wide ribbon
 * instead of a square with half-metre stiles.
 *
 * ── Grain ─────────────────────────────────────────────────────────────────
 *
 * Every member is drawn as its own rectangle rather than the whole frame
 * being one shape with the glass punched out of it. That costs a few more
 * elements and buys the thing that makes laminated profile look laminated:
 * grain runs along each member, so stiles are vertical and rails horizontal,
 * as on a real window.
 *
 * ── Opening symbols ───────────────────────────────────────────────────────
 *
 * Read off the client's own drawings (`public/cal/windows/win_2.svg` and
 * `win_3.svg`) rather than from a convention: the casement chevron's apex
 * sits on the side *opposite* the hinge, and a tilt adds a triangle standing
 * on the bottom edge. `win_3` is a tilt-turn and carries both, which is
 * exactly how they compose here.
 */

const INK = "#333436";
const OPENING = "#D91C2B";
const GLASS = "#f7fafc";

/**
 * How many times the lamination tile repeats across the construction's long
 * side — and so, directly, how many texture pixels land in each millimetre of
 * the drawing. Ten, up from one: see the tile comment in `SchemeView`.
 */
const TEXTURE_DETAIL = 10;

/**
 * The tile's own proportions, matching the shipped lamination photographs
 * (~486 x 152), so the grain is drawn at its natural aspect rather than
 * squashed — `preserveAspectRatio="none"` on the `<image>` means the tile's
 * shape *is* the texture's shape.
 */
const TEXTURE_ASPECT = 152 / 486;

interface SchemeViewProps {
  scheme: SchemeGeometry;
  widthMm: number;
  heightMm: number;
  /** Tiled across every member. Falls back to `laminationColor` when absent. */
  laminationTexture?: string | null;
  laminationColor: string;
  hardwareColor: string;
  profile?: ProfileWidths;
  title?: string;
  className?: string;
  /**
   * Editor affordances, unused by the public calculator.
   *
   * When `onSelectPane` is given the drawing becomes clickable and the
   * selected cell is outlined — which is what lets the admin panel's scheme
   * constructor use the real renderer as its canvas instead of maintaining a
   * second, approximate one that could drift from what visitors see.
   */
  selectedPath?: number[] | null;
  onSelectPane?: (path: number[]) => void;
  /**
   * Draws the overall size, and each sash's own width, on the drawing.
   *
   * Off by default because the thumbnails in the picker have no room for it;
   * the stage turns it on. Sash sizes are the number the sales desk gets asked
   * for most and the one a text summary cannot carry.
   */
  dimensions?: boolean;
}

export function SchemeView({
  scheme,
  widthMm,
  heightMm,
  laminationTexture,
  laminationColor,
  hardwareColor,
  profile = defaultProfile,
  title,
  className,
  selectedPath,
  onSelectPane,
  dimensions = false,
}: SchemeViewProps) {
  const uid = useId().replace(/:/g, "");
  const layout = layoutScheme(scheme, widthMm, heightMm, profile);

  // Two patterns, not one: the vertical members reuse the same image turned a
  // quarter turn, which is what keeps grain running *along* every member.
  const grainH = `grain-h-${uid}`;
  const grainV = `grain-v-${uid}`;

  // The tile is derived from the construction's long side, so grain reads at
  // the same scale on a narrow casement and on a five-sash run — divided by
  // `TEXTURE_DETAIL`, which is the whole of the resolution story.
  //
  // It used to be one tile across the entire construction. A lamination
  // photograph is ~486 px wide, so a 3000 mm run stretched those 486 px over
  // the full width of the drawing and the grain came out as soft smears; a
  // 60 mm stile showed a single blurred slice of one pixel column. Repeating
  // the tile ten times over the same span puts ten times as many texture
  // pixels into every millimetre of the drawing, which is both sharper and
  // closer to the real material — laminated profile repeats its grain every
  // couple of hundred millimetres, not once per window.
  const tile = Math.max(widthMm, heightMm) / TEXTURE_DETAIL;
  const tileHeight = tile * TEXTURE_ASPECT;

  const fill = (direction: "h" | "v") =>
    laminationTexture ? `url(#${direction === "h" ? grainH : grainV})` : laminationColor;

  // Dimension lines live outside the construction, so the viewBox has to make
  // room for them — proportional to the drawing so the margin holds at any
  // size rather than swallowing a small casement.
  const pad = dimensions ? Math.max(widthMm, heightMm) * 0.13 : 0;

  return (
    <svg
      viewBox={`${-pad} ${-pad * 0.35} ${widthMm + pad * 1.35} ${heightMm + pad * 1.35}`}
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {laminationTexture ? (
          <>
            <pattern id={grainH} patternUnits="userSpaceOnUse" width={tile} height={tileHeight}>
              <image
                href={laminationTexture}
                width={tile}
                height={tileHeight}
                preserveAspectRatio="none"
                imageRendering="optimizeQuality"
              />
            </pattern>
            <pattern
              id={grainV}
              patternUnits="userSpaceOnUse"
              width={tile}
              height={tileHeight}
              patternTransform="rotate(90)"
            >
              <image
                href={laminationTexture}
                width={tile}
                height={tileHeight}
                preserveAspectRatio="none"
                imageRendering="optimizeQuality"
              />
            </pattern>
          </>
        ) : null}
      </defs>

      {/* The colour sits under the texture so a tile that has not loaded (or a
          colour with no photograph at all) still reads as that colour rather
          than as a hole. The arched head's own ground is the filled arc below;
          the square corners beside it stay empty, which is what makes the
          silhouette read as an arch. */}
      <rect
        x={0}
        y={layout.arch ? layout.arch.spring : 0}
        width={widthMm}
        height={heightMm - (layout.arch ? layout.arch.spring : 0)}
        fill={laminationColor}
      />

      {layout.arch ? (
        <>
          <path d={`${layout.arch.outline} Z`} fill={laminationColor} />
          <path d={`${layout.arch.outline} Z`} fill={fill("h")} />
          <path d={`${layout.arch.glass} Z`} fill={GLASS} />
        </>
      ) : null}

      {frameMembers(
        layout.arch
          ? { x: 0, y: layout.arch.spring, width: widthMm, height: heightMm - layout.arch.spring }
          : layout.outer,
        profile.frame,
      ).map((member, index) => (
        <rect key={`frame-${index}`} {...member.rect} fill={fill(member.grain)} />
      ))}

      {layout.bars.map((bar, index) => (
        <rect
          key={`bar-${index}`}
          {...bar.rect}
          // A mullion runs vertically, so its grain does too — and the tree's
          // `v` split is what produced it.
          fill={fill(bar.direction === "v" ? "v" : "h")}
        />
      ))}

      {layout.panes.map((pane, index) => (
        <g key={`pane-${index}`}>
          <rect {...pane.glass} fill={GLASS} />
          {pane.opening !== "fixed"
            ? frameMembers(pane.sash, profile.sash).map((member, sashIndex) => (
                <rect key={sashIndex} {...member.rect} fill={fill(member.grain)} />
              ))
            : null}
          {/* Redrawn on top of the sash members: the glass is inside them. */}
          <rect {...pane.glass} fill={GLASS} />
        </g>
      ))}

      {/* Outlines last, so no member's edge is buried under a neighbour. */}
      <g fill="none" stroke={INK} strokeWidth={1} vectorEffect="non-scaling-stroke">
        {layout.arch ? (
          <>
            <path d={layout.arch.outline} />
            <path d={layout.arch.glass} />
            <rect
              x={0}
              y={layout.arch.spring}
              width={widthMm}
              height={heightMm - layout.arch.spring}
            />
          </>
        ) : (
          <rect x={0} y={0} width={widthMm} height={heightMm} />
        )}
        {layout.panes.map((pane, index) => (
          <g key={index}>
            <rect {...pane.cell} />
            {pane.opening !== "fixed" ? <rect {...pane.sash} /> : null}
            <rect {...pane.glass} />
          </g>
        ))}
      </g>

      <g fill="none" stroke={OPENING} strokeWidth={1.1} vectorEffect="non-scaling-stroke">
        {layout.panes.map((pane, index) => (
          <OpeningSymbol key={index} pane={pane} />
        ))}
      </g>

      {layout.panes.map((pane, index) => (
        <Handle key={index} pane={pane} color={hardwareColor} kind={scheme.kind} />
      ))}

      {dimensions ? <Dimensions layout={layout} pad={pad} /> : null}

      {onSelectPane
        ? layout.panes.map((pane, index) => {
            const selected = samePath(pane.path, selectedPath ?? null);
            return (
              <rect
                key={`hit-${index}`}
                {...pane.cell}
                // Transparent rather than absent: a zero-opacity rectangle
                // still takes the click, so the whole cell is a target and not
                // just the lines drawn in it.
                fill="transparent"
                stroke={selected ? OPENING : "transparent"}
                strokeWidth={selected ? 3 : 0}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer"
                onClick={() => onSelectPane(pane.path)}
              />
            );
          })
        : null}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Dimension lines — overall width and height, plus each sash's own width.
 *
 * The per-sash widths are the point: a visitor sizing a three-sash run wants
 * to know how wide each leaf comes out, and that number exists nowhere else —
 * the request summary carries only the overall size. They are drawn only where
 * the drawing has room, because a 400 mm cell in a five-sash run cannot hold a
 * four-digit label without colliding with its neighbours.
 *
 * Text is sized in viewBox units and so scales with the drawing; the strokes
 * use `non-scaling-stroke` and stay hairlines, which is the pairing that keeps
 * a 3000 mm run and a 600 mm casement equally legible.
 */
function Dimensions({ layout, pad }: { layout: SchemeLayout; pad: number }) {
  const { widthMm, heightMm } = layout;
  const font = pad * 0.34;
  const tick = pad * 0.12;

  // The overall run sits below the construction, the height to its left.
  const baseY = heightMm + pad * 0.52;
  const sideX = -pad * 0.52;

  // A cell narrower than this cannot hold its label without touching the
  // neighbouring one, so it goes without rather than overlapping.
  const minLabelled = font * 4.2;

  // Only the sashes along the bottom row get their own line: dimensioning
  // every cell of a stacked scheme would produce a ladder of overlapping
  // numbers, and the bottom row is the one a fitter measures against.
  const bottom = Math.max(...layout.panes.map((p) => p.cell.y + p.cell.height));
  const bottomRow = layout.panes
    .filter((p) => Math.abs(p.cell.y + p.cell.height - bottom) < 1)
    .sort((a, b) => a.cell.x - b.cell.x);

  const sashY = heightMm + pad * 0.2;

  return (
    <g
      stroke={INK}
      strokeWidth={1}
      vectorEffect="non-scaling-stroke"
      fill="none"
      opacity={0.75}
      aria-hidden
    >
      {bottomRow.length > 1
        ? bottomRow.map((pane, index) => {
            const x0 = pane.cell.x;
            const x1 = pane.cell.x + pane.cell.width;
            return (
              <g key={index}>
                <line x1={x0} y1={sashY} x2={x1} y2={sashY} />
                <line x1={x0} y1={sashY - tick} x2={x0} y2={sashY + tick} />
                <line x1={x1} y1={sashY - tick} x2={x1} y2={sashY + tick} />
                {pane.cell.width >= minLabelled ? (
                  <text
                    x={(x0 + x1) / 2}
                    y={sashY - tick * 1.6}
                    fontSize={font * 0.82}
                    textAnchor="middle"
                    fill={INK}
                    stroke="none"
                  >
                    {Math.round(pane.cell.width)}
                  </text>
                ) : null}
              </g>
            );
          })
        : null}

      <line x1={0} y1={baseY} x2={widthMm} y2={baseY} />
      <line x1={0} y1={baseY - tick} x2={0} y2={baseY + tick} />
      <line x1={widthMm} y1={baseY - tick} x2={widthMm} y2={baseY + tick} />
      <text
        x={widthMm / 2}
        y={baseY + font * 1.05}
        fontSize={font}
        textAnchor="middle"
        fill={INK}
        stroke="none"
      >
        {Math.round(widthMm)}
      </text>

      <line x1={sideX} y1={0} x2={sideX} y2={heightMm} />
      <line x1={sideX - tick} y1={0} x2={sideX + tick} y2={0} />
      <line x1={sideX - tick} y1={heightMm} x2={sideX + tick} y2={heightMm} />
      <text
        x={sideX - font * 0.4}
        y={heightMm / 2}
        fontSize={font}
        textAnchor="middle"
        fill={INK}
        stroke="none"
        transform={`rotate(-90 ${sideX - font * 0.4} ${heightMm / 2})`}
      >
        {Math.round(heightMm)}
      </text>
    </g>
  );
}

/**
 * A rectangular frame as its four members, mitred at the corners.
 *
 * Stiles take the full height and rails sit between them, which is both how a
 * window is actually assembled and what gives each member the right grain.
 */
function frameMembers(rect: Rect, width: number): { rect: Rect; grain: "h" | "v" }[] {
  const inner = Math.max(rect.height - width * 2, 0);
  return [
    { grain: "v", rect: { x: rect.x, y: rect.y, width, height: rect.height } },
    {
      grain: "v",
      rect: { x: rect.x + rect.width - width, y: rect.y, width, height: rect.height },
    },
    {
      grain: "h",
      rect: {
        x: rect.x + width,
        y: rect.y,
        width: Math.max(rect.width - width * 2, 0),
        height: width,
      },
    },
    {
      grain: "h",
      rect: {
        x: rect.x + width,
        y: rect.y + width + inner,
        width: Math.max(rect.width - width * 2, 0),
        height: width,
      },
    },
  ];
}

/**
 * The opening indication, in the client's own convention.
 *
 * `casement`/`tilt-turn` draw a chevron whose apex is on the side opposite the
 * hinge; `tilt`/`tilt-turn` add a triangle standing on the bottom edge. A
 * `fixed` pane draws nothing, which is the point of calling it fixed.
 */
function OpeningSymbol({ pane }: { pane: LaidOutPane }) {
  const { glass, opening, hinge } = pane;
  if (opening === "fixed" || glass.width <= 0 || glass.height <= 0) return null;

  const left = glass.x;
  const right = glass.x + glass.width;
  const top = glass.y;
  const bottom = glass.y + glass.height;
  const midY = glass.y + glass.height / 2;
  const midX = glass.x + glass.width / 2;

  const parts = [];

  if (opening === "casement" || opening === "tilt-turn") {
    // Apex opposite the hinge — a right-hung sash points its chevron left.
    const apexX = hinge === "left" ? right : left;
    const baseX = hinge === "left" ? left : right;
    parts.push(
      <polyline key="swing" points={`${baseX},${top} ${apexX},${midY} ${baseX},${bottom}`} />,
    );
  }

  if (opening === "tilt" || opening === "tilt-turn") {
    parts.push(
      <polyline key="tilt" points={`${left},${bottom} ${midX},${top} ${right},${bottom}`} />,
    );
  }

  return <>{parts}</>;
}

/**
 * The handle.
 *
 * Drawn from the pane's own geometry rather than lifted out of the source
 * file's path order, which is what the old SVG-based renderer had to do. It sits on
 * the leaf edge — opposite the hinge — and a door's sits at roughly the
 * height a door handle is actually fitted rather than halfway up the leaf.
 */
function Handle({
  pane,
  color,
  kind,
}: {
  pane: LaidOutPane;
  color: string;
  kind: "window" | "door";
}) {
  const { sash, opening, hinge } = pane;
  if (opening === "fixed" || opening === "tilt") return null;
  if (sash.width <= 0 || sash.height <= 0) return null;

  // Proportional to the sash so it stays visible on a small casement without
  // swamping it, and clamped so a 3000 mm run does not grow a comic handle.
  const length = Math.min(Math.max(sash.height * 0.11, 90), 190);
  const thickness = Math.max(length * 0.16, 14);

  const onLeft = hinge === "right";
  const x = onLeft ? sash.x - thickness / 2 : sash.x + sash.width - thickness / 2;

  // 1000 mm is where a door handle lives; a window's sits mid-sash.
  const centreY =
    kind === "door"
      ? Math.min(Math.max(pane.cell.y + pane.cell.height - 1000, sash.y), sash.y + sash.height)
      : sash.y + sash.height / 2;

  return (
    <rect
      x={x}
      y={centreY - length / 2}
      width={thickness}
      height={length}
      rx={thickness / 2}
      fill={color}
      stroke={INK}
      strokeWidth={0.8}
      vectorEffect="non-scaling-stroke"
    />
  );
}
