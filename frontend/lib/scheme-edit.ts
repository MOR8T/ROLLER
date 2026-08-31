/**
 * Editing operations on a scheme's split tree.
 *
 * Kept apart from `lib/scheme-geometry.ts` — that module lays a tree out and
 * is used by the public calculator; this one reshapes trees and is only ever
 * loaded by the admin panel. Everything here is pure and immutable: an edit
 * returns a new tree, which is what lets the editor keep an undo stack and
 * lets React see the change.
 *
 * A cell is addressed by its `path` — the child indices walked from the root,
 * the same value `LaidOutPane.path` carries, so a click on the preview maps
 * straight onto these functions.
 */

import { isSplit, type Hinge, type OpeningType, type SchemeNode } from "@/lib/scheme-geometry";

/** The node at `path`, or null if the path does not lead anywhere. */
export function nodeAt(tree: SchemeNode, path: number[]): SchemeNode | null {
  let current: SchemeNode = tree;
  for (const index of path) {
    if (!isSplit(current)) return null;
    const child = current.children[index];
    if (!child) return null;
    current = child.node;
  }
  return current;
}

/** A copy of `tree` with the node at `path` replaced. */
export function replaceAt(tree: SchemeNode, path: number[], next: SchemeNode): SchemeNode {
  if (path.length === 0) return next;

  const [index, ...rest] = path;
  if (!isSplit(tree)) return tree;
  const child = tree.children[index];
  if (!child) return tree;

  const children = tree.children.slice();
  children[index] = { ...child, node: replaceAt(child.node, rest, next) };
  return { ...tree, children };
}

/**
 * Divides the cell at `path` in two.
 *
 * The cell's existing contents become the first half, so splitting a casement
 * keeps that casement rather than resetting it — an admin dividing a sash in
 * two is adding a neighbour, not starting over. The new half is a fixed pane,
 * which is the one opening type that needs no further decision.
 *
 * Splitting a cell that is *already* split the same way adds a third child
 * rather than nesting: three columns should be one split of three, not a
 * split holding a split, or the weights stop meaning what they look like.
 */
export function splitAt(tree: SchemeNode, path: number[], direction: "v" | "h"): SchemeNode {
  const target = nodeAt(tree, path);
  if (!target) return tree;

  if (isSplit(target) && target.split === direction) {
    const average =
      target.children.reduce((sum, child) => sum + child.weight, 0) / target.children.length;
    return replaceAt(tree, path, {
      ...target,
      children: [...target.children, { weight: average, node: { opening: "fixed", hinge: null } }],
    });
  }

  return replaceAt(tree, path, {
    split: direction,
    children: [
      { weight: 1, node: target },
      { weight: 1, node: { opening: "fixed", hinge: null } },
    ],
  });
}

/**
 * Removes the cell at `path`, and collapses its parent if only one is left.
 *
 * A split with a single child is not a split — leaving one behind would draw
 * a mullion against the frame with nothing on the far side of it. The root
 * cannot be removed: a scheme with no cells is not a scheme.
 */
export function removeAt(tree: SchemeNode, path: number[]): SchemeNode {
  if (path.length === 0) return tree;

  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parent = nodeAt(tree, parentPath);
  if (!parent || !isSplit(parent)) return tree;

  const children = parent.children.filter((_, i) => i !== index);
  if (children.length === 0) return tree;
  if (children.length === 1) return replaceAt(tree, parentPath, children[0].node);

  return replaceAt(tree, parentPath, { ...parent, children });
}

/**
 * Sets the opening type of the cell at `path`.
 *
 * The hinge travels with it because the two are not independent: a fixed pane
 * must have none (the backend rejects one that does) and an opening pane must
 * have one, or the chevron has no side to point away from. Changing a
 * casement to fixed therefore drops the hinge, and the reverse supplies a
 * default rather than leaving it null.
 */
export function setOpeningAt(tree: SchemeNode, path: number[], opening: OpeningType): SchemeNode {
  const target = nodeAt(tree, path);
  if (!target || isSplit(target)) return tree;

  if (opening === "fixed") {
    return replaceAt(tree, path, { opening, hinge: null });
  }

  // A tilt sash is bottom-hung by definition; the others keep whatever side
  // they had, defaulting to the right, which is the commoner hand in the
  // client's own drawings (54 right against 26 left).
  const hinge: Hinge =
    opening === "tilt"
      ? "bottom"
      : target.hinge && target.hinge !== "bottom"
        ? target.hinge
        : "right";

  return replaceAt(tree, path, { opening, hinge });
}

/** Sets the hinge side of the cell at `path`. Ignored for a fixed pane. */
export function setHingeAt(tree: SchemeNode, path: number[], hinge: Hinge): SchemeNode {
  const target = nodeAt(tree, path);
  if (!target || isSplit(target) || target.opening === "fixed") return tree;
  return replaceAt(tree, path, { ...target, hinge });
}

/**
 * Sets the weight of the cell at `path` within its parent.
 *
 * Weights are relative and the renderer normalises them, so this is "how many
 * shares of the leftover space", not a millimetre value.
 */
export function setWeightAt(tree: SchemeNode, path: number[], weight: number): SchemeNode {
  if (path.length === 0) return tree;

  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parent = nodeAt(tree, parentPath);
  if (!parent || !isSplit(parent)) return tree;

  const children = parent.children.slice();
  children[index] = { ...children[index], weight: Math.max(weight, 0.1) };
  return replaceAt(tree, parentPath, { ...parent, children });
}

/** How many sashes wide the tree reads — mirrors the backend's `count_columns`. */
export function countColumns(node: SchemeNode): number {
  if (!isSplit(node)) return 1;
  const counts = node.children.map((child) => countColumns(child.node));
  return node.split === "v" ? counts.reduce((sum, value) => sum + value, 0) : Math.max(...counts);
}

export function samePath(a: number[] | null, b: number[] | null): boolean {
  if (!a || !b) return a === b;
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
