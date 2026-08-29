#!/usr/bin/env python3
"""
Converts the 55 parsed drawings in `frontend/data/calculator-schemes.json`
into *declared geometry* — the shape the admin panel can author and the
calculator can render at any size.

── Why a conversion at all ────────────────────────────────────────────────

Today a scheme is a drawing read as absolute boxes: each pane carries
`[x0, y0, x1, y1]` in the drawing's own coordinates. That is why the size
sliders cannot touch the picture — stretching those boxes to 3000x400 would
draw stiles half a metre thick. It is also why nobody but the parser can
author a scheme.

Declared geometry replaces the absolute boxes with the *structure* the
drawing depicts: how the frame is divided, and what each division holds. The
profile then stays a constant number of millimetres at any size, and only the
glass stretches — which is what a real elevation does.

── The structure ──────────────────────────────────────────────────────────

A recursive split tree, not a grid. A grid cannot express what these drawings
actually contain:

  win_6  a transom across the full width, and the space *under* it split in two
  win_9  a full-height casement beside a stacked casement/fixed pair

Both are guillotine cuts, just in different orders, so:

    node = split(direction, [(weight, node), ...])   # "v" = mullions, "h" = transoms
         | leaf(opening, hinge)

`weight` is relative — the renderer normalises it — so the same tree draws at
any width and height.

── How the tree is recovered ──────────────────────────────────────────────

Standard guillotine detection: inside a bounding box, look for a cut line
that no pane straddles; group the panes either side; recurse. A drawing whose
panes cannot be separated that way is reported rather than guessed at, and
`--report` prints those instead of writing output.

The only tolerance involved is for float noise. A pane's box is its *glass*,
and an opening sash insets that glass by roughly a second profile width, so
the gap between two cells varies — but a gap of any size is still a cut, and
cells that abut exactly (`84.6..92.7` starting where `48.9..84.6` ends, as in
win_34's transom) are cuts too. Only genuinely *overlapping* panes mean no
cut exists, which is what the comparison below tests.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE = REPO_ROOT / "frontend" / "data" / "calculator-schemes.json"
DESTINATION = REPO_ROOT / "backend" / "app" / "seeds" / "calculator-schemes.json"

# Float noise only. Two panes count as separable unless they genuinely
# overlap by more than this — see the module docstring on why no wider
# tolerance belongs here.
EPSILON = 0.01


def edges(panes: list[dict], axis: int) -> list[tuple[float, float]]:
    """Each pane's (start, end) along `axis` — 0 for x, 1 for y."""
    return [(pane["box"][axis], pane["box"][axis + 2]) for pane in panes]


def find_cuts(panes: list[dict], axis: int) -> list[list[dict]] | None:
    """
    Splits `panes` into groups separated by a guillotine cut along `axis`.

    Returns None when no cut exists (the panes overlap across the whole
    span), which is the caller's signal to try the other axis.
    """
    if len(panes) < 2:
        return None

    order = sorted(range(len(panes)), key=lambda i: panes[i]["box"][axis])
    spans = edges(panes, axis)

    groups: list[list[dict]] = []
    current: list[int] = []
    reach = float("-inf")

    for index in order:
        start, end = spans[index]
        # A pane that starts at or beyond everything seen so far opens a new
        # group: nothing straddles the line between, so a cut can go there.
        if current and start >= reach - EPSILON:
            groups.append([panes[i] for i in current])
            current = []
        current.append(index)
        reach = max(reach, end)

    if current:
        groups.append([panes[i] for i in current])

    return groups if len(groups) > 1 else None


def span(panes: list[dict], axis: int) -> tuple[float, float]:
    """The group's glass extent along `axis`."""
    return (
        min(pane["box"][axis] for pane in panes),
        max(pane["box"][axis + 2] for pane in panes),
    )


def boundaries(groups: list[list[dict]], axis: int, lo: float, hi: float) -> list[float]:
    """
    Where the cells actually divide, as opposed to where the glass stops.

    A pane's box is its glass, and an opening sash insets its glass by roughly
    a second profile width while a fixed pane's sits directly in the rebate.
    Weighing cells by glass extent therefore shrinks every casement: in win_5
    the two halves are equal in the drawing but their glass measures 61.9 and
    48.3, which would render as 56/44.

    Cutting each boundary at the midline of the gap between neighbours removes
    that bias without a per-opening fudge factor — the mullion is shared, so
    half of it belongs to each side. The outermost edges come from the parent
    cell, which is the frame's inner face at the root.
    """
    edges = [lo]
    for before, after in zip(groups, groups[1:]):
        edges.append((span(before, axis)[1] + span(after, axis)[0]) / 2)
    edges.append(hi)
    return edges


def build(panes: list[dict], box: list[float]) -> dict:
    """
    The split tree for one group of panes, laid out inside `box`.

    `box` is the cell the group occupies — needed because cell weights are
    measured from cell boundaries, not from the glass inside them.
    """
    if len(panes) == 1:
        pane = panes[0]
        return {"opening": pane["opening"], "hinge": pane["hinge"]}

    # Vertical cuts first — a window is read as columns before rows, and
    # trying them in a fixed order keeps the output stable across runs.
    for axis, direction in ((0, "v"), (1, "h")):
        groups = find_cuts(panes, axis)
        if not groups:
            continue

        edges = boundaries(groups, axis, box[axis], box[axis + 2])
        children = []
        for index, group in enumerate(groups):
            child_box = list(box)
            child_box[axis] = edges[index]
            child_box[axis + 2] = edges[index + 1]
            children.append(
                {
                    "weight": round(edges[index + 1] - edges[index], 2),
                    "node": build(group, child_box),
                }
            )

        return {"split": direction, "children": children}

    raise ValueError("panes cannot be separated by a guillotine cut")


# The manufacturing limits the calculator enforces, mirrored from
# `frontend/data/calculator.ts`'s `sizeLimits`. Duplicated rather than
# imported because this is a one-off Python script and that is a TypeScript
# module; if the limits move, this list is the other place to change.
LIMITS = {
    "window": {"width": (400, 3000), "height": (400, 2500), "default_height": 1400},
    "door": {"width": (700, 2400), "height": (1800, 2800), "default_height": 2100},
}


def default_size(scheme: dict) -> tuple[int, int]:
    """
    The size a variant opens at.

    Taken from the drawing's own proportions: a single casement is drawn tall
    and narrow, a five-sash run wide and low, and opening each at its natural
    shape is the difference between a visitor adjusting two sliders every time
    they try a variant and adjusting none.

    Height is the construction's usual one and width follows the aspect, both
    rounded to the 10 mm the sliders step in and clamped to what the workshop
    will actually make.
    """
    limits = LIMITS[scheme["kind"]]
    height = limits["default_height"]
    aspect = scheme["vw"] / scheme["vh"]

    width = int(round(height * aspect / 10.0) * 10)
    width = max(limits["width"][0], min(limits["width"][1], width))
    height = max(limits["height"][0], min(limits["height"][1], height))
    return width, height


def arch_rise(scheme: dict) -> float | None:
    """
    The arched head's rise, as a fraction of the construction's width.

    `spring` is where the drawing's arc springs from and the arch box's top is
    its crown, so the difference between them is the rise. Ten of the 55
    drawings have one, between 0.18 and 0.38 of the width, and every one of
    them is a fixed light.
    """
    arch = scheme["arch"]
    if arch is None:
        return None
    return round((arch["spring"] - arch["box"][1]) / scheme["vw"], 4)


def convert(scheme: dict) -> dict:
    # The root cell is the frame's inner face: the panes sit inside the frame,
    # so measuring the outermost cells against the drawing's outer edge would
    # hand them the frame's own thickness.
    outer = scheme["outer"]
    profile = scheme["profile"]
    root = [
        outer[0] + profile,
        outer[1] + profile,
        outer[2] - profile,
        outer[3] - profile,
    ]

    # Under an arched head the panes start at the springing line, not at the
    # frame's top. Measuring them against the top would hand the topmost row
    # the whole arch as extra weight and squash everything below it.
    if scheme["arch"] is not None:
        root[1] = scheme["arch"]["spring"] + profile

    return {
        "key": scheme["id"],
        "kind": scheme["kind"],
        "columns": scheme["columns"],
        # A segmental arched head, as a rise relative to the width — the one
        # form these ten drawings use, and always a fixed light. Relative so
        # it survives resizing: an arch is a proportion of the opening, not a
        # fixed number of millimetres.
        "arch": arch_rise(scheme),
        "default_width_mm": default_size(scheme)[0],
        "default_height_mm": default_size(scheme)[1],
        # Kept so a converted scheme can be compared against the drawing it
        # came from — the renderer itself never reads them.
        "source_aspect": round(scheme["vw"] / scheme["vh"], 4),
        "geometry": build(scheme["panes"], root),
    }


def leaves(node: dict) -> int:
    if "split" not in node:
        return 1
    return sum(leaves(child["node"]) for child in node["children"])


def bad_weights(node: dict) -> list[float]:
    """
    Weights that cannot be laid out.

    A zero or negative weight means the midline boundaries came out inverted —
    the group ordering and the parent box disagree — and the renderer would
    draw a cell of no width rather than fail. Caught here instead.
    """
    if "split" not in node:
        return []
    found = [child["weight"] for child in node["children"] if child["weight"] <= 0]
    for child in node["children"]:
        found.extend(bad_weights(child["node"]))
    return found


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--report",
        action="store_true",
        help="print what each drawing converts to, and write nothing",
    )
    args = parser.parse_args()

    schemes = json.loads(SOURCE.read_text(encoding="utf-8"))
    converted: list[dict] = []
    failures: list[tuple[str, str]] = []

    for scheme in schemes:
        try:
            result = convert(scheme)
        except ValueError as error:
            failures.append((scheme["id"], str(error)))
            continue

        # A conversion that loses or invents a pane is a silent wrong answer,
        # so it is checked here rather than trusted.
        if leaves(result["geometry"]) != len(scheme["panes"]):
            failures.append(
                (scheme["id"], f"{leaves(result['geometry'])} leaves vs {len(scheme['panes'])} panes")
            )
            continue

        degenerate = bad_weights(result["geometry"])
        if degenerate:
            failures.append((scheme["id"], f"non-positive weights {degenerate}"))
            continue

        converted.append(result)

    if args.report:
        for result in converted:
            print(f"{result['key']:<10} {result['kind']:<7} cols={result['columns']} "
                  f"arch={str(result['arch']):<6} "
                  f"default={result['default_width_mm']}x{result['default_height_mm']} "
                  f"panes={leaves(result['geometry'])}")

    print(f"\nconverted {len(converted)}/{len(schemes)}")
    if failures:
        print("failed:")
        for key, reason in failures:
            print(f"  {key}: {reason}")

    if args.report:
        return

    if failures:
        raise SystemExit("refusing to write a partial seed")

    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    DESTINATION.write_text(
        json.dumps(converted, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"wrote {DESTINATION.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
