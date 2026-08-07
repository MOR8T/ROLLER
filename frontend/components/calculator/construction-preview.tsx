import { colorSwatches } from "@/data/catalog";
import type { ConfiguredItem, OpeningType } from "@/data/calculator";
import { cn } from "@/lib/utils";

/**
 * Live preview of the configured unit — a **parametric SVG**
 * (`project_plan/06-*.md`, decision 15).
 *
 * A photoreal preview is not buildable from what exists: all 188 renders the
 * client supplied are single-sash windows, and there is not one two-sash unit
 * or door among them. Vector geometry draws any sash count at any proportion,
 * costs nothing on mobile and redraws instantly, which is what makes the
 * dependency cascade visible at all.
 *
 * The drawing is to scale: the viewBox is the unit's real size in millimetres,
 * so a 3000×700 transom window looks like one. Frame and sash thicknesses are
 * ordinary profile dimensions rather than tuned constants — the preview is not
 * a technical drawing, but it must not lie about proportion.
 */

/** Outer frame, sash frame, mullion — millimetres. */
const FRAME = 62;
const SASH = 52;
const MULLION = 90;
/** Height of the transom light above a door leaf. */
const TRANSOM = 420;

const GLASS = "#dbe6ea";
const GLASS_EDGE = "#b9ccd3";
const OUTLINE = "#1d1d1b";

export function ConstructionPreview({
  item,
  className,
  label,
}: {
  item: ConfiguredItem;
  className?: string;
  /** Spoken description of the unit — the SVG is an image, not decoration. */
  label: string;
}) {
  const { widthMm: w, heightMm: h } = item;
  const frameFill = colorSwatches[item.color] ?? colorSwatches.white;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      className={cn("h-full w-full", className)}
    >
      {/* Outer frame: the whole outline filled, then the light cut out of it. */}
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill={frameFill}
        stroke={OUTLINE}
        strokeOpacity={0.35}
        strokeWidth={8}
      />

      {item.construction === "window" ? renderWindow(item, frameFill) : renderDoor(item, frameFill)}
    </svg>
  );
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function inset(rect: Rect, by: number): Rect {
  return {
    x: rect.x + by,
    y: rect.y + by,
    width: Math.max(rect.width - by * 2, 1),
    height: Math.max(rect.height - by * 2, 1),
  };
}

function renderWindow(item: ConfiguredItem, frameFill: string) {
  const light: Rect = {
    x: FRAME,
    y: FRAME,
    width: item.widthMm - FRAME * 2,
    height: item.heightMm - FRAME * 2,
  };

  const count = item.sashes.length;
  const columnWidth = (light.width - MULLION * (count - 1)) / count;

  return (
    <>
      {item.sashes.map((opening, index) => {
        const column: Rect = {
          x: light.x + index * (columnWidth + MULLION),
          y: light.y,
          width: columnWidth,
          height: light.height,
        };

        return (
          <Sash
            key={index}
            rect={column}
            opening={opening}
            frameFill={frameFill}
            // Hinges go on the outer edge of the unit, which is how a two- or
            // three-sash window is actually hung; the middle sash of a triple
            // takes the left jamb.
            hinge={index === count - 1 && count > 1 ? "right" : "left"}
          />
        );
      })}
    </>
  );
}

function renderDoor(item: ConfiguredItem, frameFill: string) {
  const light: Rect = {
    x: FRAME,
    y: FRAME,
    width: item.widthMm - FRAME * 2,
    height: item.heightMm - FRAME * 2,
  };

  if (item.doorLayout === "transom") {
    const transomHeight = Math.min(TRANSOM, light.height * 0.3);
    const transom: Rect = { ...light, height: transomHeight };
    const leaf: Rect = {
      x: light.x,
      y: light.y + transomHeight + MULLION,
      width: light.width,
      height: light.height - transomHeight - MULLION,
    };

    return (
      <>
        <Sash rect={transom} opening="fixed" frameFill={frameFill} hinge="left" />
        <Sash rect={leaf} opening="casement" frameFill={frameFill} hinge="left" door />
      </>
    );
  }

  if (item.doorLayout === "double") {
    const leafWidth = (light.width - MULLION) / 2;

    return (
      <>
        <Sash
          rect={{ ...light, width: leafWidth }}
          opening="casement"
          frameFill={frameFill}
          hinge="left"
          door
        />
        <Sash
          rect={{ ...light, x: light.x + leafWidth + MULLION, width: leafWidth }}
          opening="casement"
          frameFill={frameFill}
          hinge="right"
          door
        />
      </>
    );
  }

  return <Sash rect={light} opening="casement" frameFill={frameFill} hinge="left" door />;
}

function Sash({
  rect,
  opening,
  frameFill,
  hinge,
  door = false,
}: {
  rect: Rect;
  opening: OpeningType;
  frameFill: string;
  hinge: "left" | "right";
  door?: boolean;
}) {
  const fixed = opening === "fixed";
  // A fixed light has no sash frame — the glass sits in the outer frame with a
  // bead, which is exactly why fixed panes read as visually larger.
  const glass = inset(rect, fixed ? 18 : SASH);

  return (
    <>
      {!fixed && (
        <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={frameFill}
          stroke={OUTLINE}
          strokeOpacity={0.3}
          strokeWidth={6}
        />
      )}
      <rect
        x={glass.x}
        y={glass.y}
        width={glass.width}
        height={glass.height}
        fill={GLASS}
        stroke={GLASS_EDGE}
        strokeWidth={4}
      />
      <OpeningMark rect={glass} opening={opening} hinge={hinge} />
      {!fixed && <Handle rect={rect} hinge={hinge} door={door} />}
    </>
  );
}

/**
 * The opening symbol, drawn the way joinery drawings draw it: the apex of the
 * triangle points at the hinge. A casement is one triangle to the side it is
 * hung on, a tilt-turn adds the bottom-hung triangle over it — which is the
 * whole difference the visitor is choosing between.
 */
function OpeningMark({
  rect,
  opening,
  hinge,
}: {
  rect: Rect;
  opening: OpeningType;
  hinge: "left" | "right";
}) {
  if (opening === "fixed") return null;

  const left = rect.x;
  const right = rect.x + rect.width;
  const top = rect.y;
  const bottom = rect.y + rect.height;
  const apexX = hinge === "left" ? left : right;
  const farX = hinge === "left" ? right : left;
  const midY = rect.y + rect.height / 2;

  const stroke = {
    stroke: OUTLINE,
    strokeOpacity: 0.4,
    strokeWidth: 2.5,
    fill: "none",
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <>
      <polyline points={`${farX},${top} ${apexX},${midY} ${farX},${bottom}`} {...stroke} />
      {opening === "tilt-turn" && (
        <polyline
          points={`${left},${top} ${rect.x + rect.width / 2},${bottom} ${right},${top}`}
          {...stroke}
          strokeDasharray="12 10"
        />
      )}
    </>
  );
}

function Handle({ rect, hinge, door }: { rect: Rect; hinge: "left" | "right"; door: boolean }) {
  const width = 26;
  const height = door ? 190 : 150;
  const x =
    hinge === "left" ? rect.x + rect.width - SASH / 2 - width / 2 : rect.x + SASH / 2 - width / 2;
  // A door handle sits at hand height; a window handle at the middle of the sash.
  const y = door ? rect.y + rect.height * 0.55 : rect.y + rect.height / 2 - height / 2;

  return (
    <rect x={x} y={y} width={width} height={height} rx={12} fill={OUTLINE} fillOpacity={0.55} />
  );
}
