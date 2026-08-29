/**
 * Declared scheme geometry, and the layout it produces.
 *
 * ── What this replaces ────────────────────────────────────────────────────
 *
 * `data/calculator-schemes.json` describes a scheme as absolute pane boxes
 * read off the client's drawings. The renderer that used it could not let the
 * size sliders touch the picture: stretching those boxes to 3000x400 would
 * draw stiles half a metre thick, so the millimetres stayed on the readouts
 * and the drawing kept the proportions it was drawn in.
 *
 * Here a scheme is instead the *structure* the drawing depicts — how the
 * frame divides, and what each division holds — and the geometry is computed
 * for whatever width and height are asked for. The profile keeps a constant
 * thickness in millimetres at every size and only the glass stretches, which
 * is what a real elevation does. `scripts/convert-calculator-schemes.py`
 * produced the 55 shipped schemes in this shape.
 *
 * ── Why a tree and not a grid ─────────────────────────────────────────────
 *
 * A grid cannot express what the drawings contain: win_6 is a transom across
 * the full width with the space under it split in two, and win_9 is a
 * full-height casement beside a stacked casement/fixed pair. Both are
 * guillotine cuts in different orders, so the shape is a recursive split —
 * `v` divides by mullions into columns, `h` by transoms into rows.
 *
 * This module is pure: it takes millimetres and returns rectangles. Nothing
 * here reads React, the DOM, or the message catalogues, so the same layout
 * drives the public calculator, the admin panel's live preview, and (later)
 * a server-rendered PNG attached to a request.
 */

export type ConstructionKind = "window" | "door";
export type OpeningType = "fixed" | "casement" | "tilt" | "tilt-turn";
export type Hinge = "left" | "right" | "bottom";

/** A cell holding one pane — a leaf of the tree. */
export interface SchemeLeaf {
  opening: OpeningType;
  /** Null for `fixed`, which has no hinge to draw. */
  hinge: Hinge | null;
}

/** A cell divided into more cells. */
export interface SchemeSplit {
  /** `v` = vertical mullions (columns), `h` = horizontal transoms (rows). */
  split: "v" | "h";
  children: { weight: number; node: SchemeNode }[];
}

export type SchemeNode = SchemeLeaf | SchemeSplit;

export interface SchemeGeometry {
  key: string;
  kind: ConstructionKind;
  /** How many sashes wide the scheme reads — the picker's grouping. */
  columns: number;
  /**
   * A segmental arched head, as a rise relative to the width, or null for a
   * square head. Relative because an arch is a proportion of the opening: a
   * fixed number of millimetres would flatten to nothing on a wide run and
   * swallow a narrow one.
   *
   * The head is always a fixed light — every arched drawing the client sent
   * is — and it sits above the body the split tree lays out in.
   */
  arch: number | null;
  /**
   * The size this variant opens at, in millimetres.
   *
   * Per-template because the shapes genuinely differ — a single casement
   * wants 530x1400 and a five-sash run 1900x1400 — and opening both at one
   * size makes the visitor correct two sliders every time they try a variant.
   */
  defaultWidthMm: number;
  defaultHeightMm: number;
  geometry: SchemeNode;
}

export function isSplit(node: SchemeNode): node is SchemeSplit {
  return "split" in node;
}

/* -------------------------------------------------------------------------- */
/* Profile dimensions                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Real millimetres, not drawing units.
 *
 * These are ordinary PVC/aluminium section widths, and they are what makes
 * the scene an elevation rather than a stretched picture: a 3000 mm run and a
 * 600 mm casement both get a 60 mm frame, so the wide one reads as wide.
 *
 * ⚠️ Per-system values (ЭКОЛАЙН's 60 mm against STELLA's 75) are a later
 * step — `data/products.ts` has `depthMm`, which is the *depth* of the
 * section, not its face width, so it cannot stand in for `frame` here.
 * One neutral set until the client supplies face widths.
 */
export interface ProfileWidths {
  /** The outer frame. */
  frame: number;
  /** A mullion or transom between two cells. */
  mullion: number;
  /** An opening sash's own section, inside its cell. */
  sash: number;
  /** The bead holding the glass — the last step in to the glazing. */
  bead: number;
}

export const defaultProfile: ProfileWidths = {
  frame: 60,
  mullion: 60,
  sash: 34,
  bead: 12,
};

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One laid-out cell: where its sash and its glass sit, in millimetres. */
export interface LaidOutPane {
  opening: OpeningType;
  hinge: Hinge | null;
  /**
   * Where this pane sits in the tree, as the child indices walked from the
   * root. `[]` is a scheme of one pane; `[1, 0]` is the first child of the
   * second.
   *
   * Carried so the admin panel can turn a click on the drawing back into the
   * node it came from — the editor selects cells by clicking the preview, and
   * without this it would need its own parallel layout pass to know what was
   * clicked.
   */
  path: number[];
  /** The cell itself — the hole in the frame this pane fills. */
  cell: Rect;
  /** The sash's outer edge. Equals `cell` for a fixed pane, which has none. */
  sash: Rect;
  /** The glazing. */
  glass: Rect;
}

/** A mullion or transom, as drawn. */
export interface LaidOutBar {
  rect: Rect;
  direction: "v" | "h";
}

/** The arched head, when there is one. */
export interface LaidOutArch {
  /** How far the crown rises above the springing line, in millimetres. */
  rise: number;
  /** The springing line — where the arc meets the body below it. */
  spring: number;
  /** The head's outer silhouette, as an SVG path. */
  outline: string;
  /** Its glazing, as an SVG path — the outline brought in by frame and bead. */
  glass: string;
}

export interface SchemeLayout {
  /** The overall construction, at the requested size. */
  outer: Rect;
  panes: LaidOutPane[];
  bars: LaidOutBar[];
  arch: LaidOutArch | null;
  widthMm: number;
  heightMm: number;
}

/**
 * A segmental arch as an SVG path, springing at `y` and rising to `rise`.
 *
 * Drawn as a true circular arc rather than a Bézier approximation: the radius
 * that passes through both springing points and the crown is
 * `(rise² + half-span²) / 2·rise`, and a sweep of 1 bulges it upward in SVG's
 * y-down space.
 */
function archPath(x: number, y: number, width: number, rise: number): string {
  if (rise <= 0 || width <= 0) return "";
  const half = width / 2;
  const radius = (rise * rise + half * half) / (2 * rise);
  return `M ${x} ${y} A ${radius} ${radius} 0 0 1 ${x + width} ${y}`;
}

function inset(rect: Rect, by: number): Rect {
  return {
    x: rect.x + by,
    y: rect.y + by,
    // A cell narrower than twice the section it is being inset by would go
    // negative and paint an inside-out rectangle. Real constructions never
    // reach this, but a slider and an admin-authored tree together can.
    width: Math.max(rect.width - by * 2, 0),
    height: Math.max(rect.height - by * 2, 0),
  };
}

function layoutNode(
  node: SchemeNode,
  cell: Rect,
  profile: ProfileWidths,
  panes: LaidOutPane[],
  bars: LaidOutBar[],
  path: number[],
): void {
  if (!isSplit(node)) {
    // A fixed pane is glazed straight into its cell; an opening one carries a
    // sash first, which is what makes a casement read as a casement even
    // before the opening lines are drawn.
    const sash = node.opening === "fixed" ? cell : inset(cell, profile.sash);
    panes.push({
      opening: node.opening,
      hinge: node.hinge,
      path,
      cell,
      sash,
      glass: inset(sash, profile.bead),
    });
    return;
  }

  const horizontal = node.split === "v";
  const total = node.children.reduce((sum, child) => sum + child.weight, 0);
  const along = horizontal ? cell.width : cell.height;

  // The bars sit *between* the children and are a fixed thickness, so only
  // what is left over gets divided by weight. This is the whole point of the
  // exercise: at 3000 mm the glass grows and the bars do not.
  const bars_total = profile.mullion * (node.children.length - 1);
  const free = Math.max(along - bars_total, 0);

  let cursor = horizontal ? cell.x : cell.y;

  node.children.forEach((child, index) => {
    const size = total > 0 ? (free * child.weight) / total : free / node.children.length;

    const childCell: Rect = horizontal
      ? { x: cursor, y: cell.y, width: size, height: cell.height }
      : { x: cell.x, y: cursor, width: cell.width, height: size };

    layoutNode(child.node, childCell, profile, panes, bars, [...path, index]);
    cursor += size;

    if (index < node.children.length - 1) {
      bars.push({
        direction: node.split,
        rect: horizontal
          ? { x: cursor, y: cell.y, width: profile.mullion, height: cell.height }
          : { x: cell.x, y: cursor, width: cell.width, height: profile.mullion },
      });
      cursor += profile.mullion;
    }
  });
}

/**
 * Lays a scheme out at a real size.
 *
 * `widthMm`/`heightMm` are the construction's outside dimensions — the same
 * numbers the sliders set and the request carries, so what the visitor sees
 * and what the sales desk reads are the same construction.
 */
export function layoutScheme(
  scheme: SchemeGeometry,
  widthMm: number,
  heightMm: number,
  profile: ProfileWidths = defaultProfile,
): SchemeLayout {
  const outer: Rect = { x: 0, y: 0, width: widthMm, height: heightMm };
  const panes: LaidOutPane[] = [];
  const bars: LaidOutBar[] = [];

  // The arched head takes its rise off the top; the split tree lays out in
  // whatever is left. Clamped so a tall arch on a short construction cannot
  // leave a body of negative height.
  const rise = scheme.arch ? Math.min(scheme.arch * widthMm, heightMm * 0.6) : 0;

  const body: Rect = { x: 0, y: rise, width: widthMm, height: heightMm - rise };
  layoutNode(scheme.geometry, inset(body, profile.frame), profile, panes, bars, []);

  const arch: LaidOutArch | null = rise
    ? {
        rise,
        spring: rise,
        outline: archPath(0, rise, widthMm, rise),
        // The glazing follows the same curve, brought in by the frame and the
        // bead — the same two steps a square head's glass takes.
        glass: archPath(
          profile.frame + profile.bead,
          rise,
          Math.max(widthMm - (profile.frame + profile.bead) * 2, 0),
          Math.max(rise - profile.frame - profile.bead, 0),
        ),
      }
    : null;

  return { outer, panes, bars, arch, widthMm, heightMm };
}
