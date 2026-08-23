"""
Turns the drawing schemes in `public/cal/` into machine-readable geometry.

The calculator needs two things from every variant: a thumbnail (the scheme
itself, used as-is) and enough structure to *render* the construction with the
lamination texture on the profile and glass in the openings. The schemes are
Figma exports of 55 files drawn over several sittings, so their path order,
fills and grouping differ from file to file — reading them element by element
turns into a per-file special case very quickly.

So nothing here reads meaning off a single path. Every ink line in the drawing
is thrown into one planar arrangement, the faces of that arrangement are
merged into regions, and the regions are classified by shape:

    a region that does not fill its own bounding box has a hole in it, which
    makes it a profile ring — a frame, an impost, a sash;
    a region that does fill its bounding box, and is wider than a profile in
    both directions, is glass.

That rule holds whatever order Figma wrote the file in. Opening type and hinge
side then come from the red indicator lines, matched to the pane they sit in.

Emits `data/calculator-schemes.json`.
"""

import json
import pathlib
import re
import subprocess

CAL = pathlib.Path(__file__).resolve().parent.parent / "public" / "cal"
OUT = pathlib.Path(__file__).resolve().parent.parent / "data" / "calculator-schemes.json"

RED = "#D91C2B"
INK = "#333436"

PATH_RE = re.compile(r"<path\b([^>]*)/>", re.S)
ATTR_RE = re.compile(r'([\w:-]+)="([^"]*)"')
TOKEN_RE = re.compile(r"[MLHVCZmlhvcz]|-?\d*\.?\d+(?:e-?\d+)?")

# Hinges and handles are drawn as pips about a profile-width across; nothing
# structural is that small, so a box under this size never contributes a cut
# line — and it is the same test that picks the hardware out for recolouring.
PIP = 13.0


def parse_path(d):
    """`d` -> subpaths, each a point list plus whether it contained a curve."""
    tokens = TOKEN_RE.findall(d)
    subpaths, points, cubics = [], [], []
    x = y = 0.0
    start = None
    curved = False
    i = 0

    def flush():
        nonlocal points, cubics, curved
        if len(points) > 1:
            subpaths.append({"pts": points, "cubics": cubics, "curved": curved})
        points, cubics, curved = [], [], False

    while i < len(tokens):
        cmd = tokens[i]
        i += 1
        if cmd == "M":
            flush()
            x, y = float(tokens[i]), float(tokens[i + 1])
            i += 2
            start = (x, y)
            points = [(x, y)]
        elif cmd == "L":
            x, y = float(tokens[i]), float(tokens[i + 1])
            i += 2
            points.append((x, y))
        elif cmd == "H":
            x = float(tokens[i])
            i += 1
            points.append((x, y))
        elif cmd == "V":
            y = float(tokens[i])
            i += 1
            points.append((x, y))
        elif cmd == "C":
            n = [float(t) for t in tokens[i : i + 6]]
            i += 6
            curved = True
            cubics.append(((x, y), (n[0], n[1]), (n[2], n[3]), (n[4], n[5])))
            points.append((n[4], n[5]))
            x, y = n[4], n[5]
        elif cmd in "Zz":
            if start:
                points.append(start)
                x, y = start
        else:
            i += 1
    flush()
    return subpaths


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return [min(xs), min(ys), max(xs), max(ys)]


def cubic_extent(cubic, axis):
    """Exact reach of one cubic along an axis, control points excluded."""
    a, b, c, d = (p[axis] for p in cubic)
    values = [a, d]
    qa = -a + 3 * b - 3 * c + d
    qb = 2 * (a - 2 * b + c)
    qc = b - a
    roots = []
    if abs(qa) < 1e-9:
        if abs(qb) > 1e-9:
            roots.append(-qc / qb)
    else:
        disc = qb * qb - 4 * qa * qc
        if disc >= 0:
            root = disc ** 0.5
            roots += [(-qb + root) / (2 * qa), (-qb - root) / (2 * qa)]
    for t in roots:
        if 0 < t < 1:
            u = 1 - t
            values.append(u**3 * a + 3 * u**2 * t * b + 3 * u * t**2 * c + t**3 * d)
    return min(values), max(values)


def path_box(subs):
    """Bounding box of subpaths, with curves measured rather than hulled."""
    pts = [p for s in subs for p in s["pts"]]
    box = bbox(pts)
    for sub in subs:
        for cubic in sub.get("cubics", ()):
            for axis in (0, 1):
                lo, hi = cubic_extent(cubic, axis)
                box[axis] = min(box[axis], lo)
                box[axis + 2] = max(box[axis + 2], hi)
    return box


def read(path):
    src = path.read_text()
    vb = [float(v) for v in re.search(r'viewBox="([\d.\s-]+)"', src).group(1).split()]
    paths = []
    for raw in PATH_RE.findall(src):
        attrs = dict(ATTR_RE.findall(raw))
        paths.append({"attrs": attrs, "subs": parse_path(attrs.get("d", ""))})
    return vb, paths


def cut_lines(paths, arches):
    """Every axis-aligned ink segment in the drawing, as cut lines."""
    skip = {id(a) for a in arches}
    verticals, horizontals = [], []
    for path in paths:
        attrs = path["attrs"]
        if attrs.get("stroke") == RED or attrs.get("fill") == INK:
            continue
        if id(path) in skip:
            continue
        for sub in path["subs"]:
            if sub["curved"]:
                continue
            box = bbox(sub["pts"])
            if box[2] - box[0] < PIP and box[3] - box[1] < PIP:
                continue  # a hinge or handle pip
            pts = sub["pts"]
            for (ax, ay), (bx, by) in zip(pts, pts[1:]):
                if abs(ax - bx) < 0.15 and abs(ay - by) > 0.4:
                    verticals.append((round((ax + bx) / 2, 2), min(ay, by), max(ay, by)))
                elif abs(ay - by) < 0.15 and abs(bx - ax) > 0.4:
                    horizontals.append((round((ay + by) / 2, 2), min(ax, bx), max(ax, bx)))

    # An arch closes the drawing at its springing line; without that the head
    # of the window leaks into the exterior and every pane below joins it.
    for arch in arches:
        pts = [p for s in arch["subs"] for p in s["pts"]]
        box = bbox(pts)
        spring = max(pts[0][1], pts[-1][1])
        horizontals.append((round(spring, 2), box[0], box[2]))
    return verticals, horizontals


def axis(values, span, tol=0.35):
    """Collapse near-identical coordinates and add a margin outside the drawing."""
    out = []
    for value in sorted(values):
        if not out or value - out[-1] > tol:
            out.append(value)
    return [span[0] - 2.0] + out + [span[1] + 2.0]


def covers(segments, at, lo, hi, tol=0.35):
    """Is the interval [lo, hi] fully drawn on the line `at`?"""
    intervals = sorted((a, b) for c, a, b in segments if abs(c - at) < tol)
    reach = lo
    for a, b in intervals:
        if a > reach + tol:
            break
        reach = max(reach, b)
    return reach >= hi - tol


def regions(verticals, horizontals, xs, ys):
    """Flood the arrangement's faces into connected regions."""
    label = [[-1] * (len(ys) - 1) for _ in range(len(xs) - 1)]
    groups = []
    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            if label[i][j] != -1:
                continue
            tag = len(groups)
            cells = []
            stack = [(i, j)]
            label[i][j] = tag
            while stack:
                ci, cj = stack.pop()
                cells.append((ci, cj))
                for di, dj in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    ni, nj = ci + di, cj + dj
                    if not (0 <= ni < len(xs) - 1 and 0 <= nj < len(ys) - 1):
                        continue
                    if label[ni][nj] != -1:
                        continue
                    if di and covers(verticals, xs[max(ci, ni)], ys[cj], ys[cj + 1]):
                        continue
                    if dj and covers(horizontals, ys[max(cj, nj)], xs[ci], xs[ci + 1]):
                        continue
                    label[ni][nj] = tag
                    stack.append((ni, nj))
            groups.append(cells)
    return groups, label


def analyse(name, kind, vb, paths):
    W, H = vb[2], vb[3]
    ink = [
        p for p in paths
        if p["subs"] and p["attrs"].get("stroke") != RED and p["attrs"].get("fill") != INK
    ]

    arches = [p for p in ink if _is_arch(p, W)]
    boxes = [path_box(p["subs"]) for p in ink]
    outer = [
        min(b[0] for b in boxes), min(b[1] for b in boxes),
        max(b[2] for b in boxes), max(b[3] for b in boxes),
    ]

    verticals, horizontals = cut_lines(ink, arches)
    xs = axis([v[0] for v in verticals], (outer[0], outer[2]))
    ys = axis([h[0] for h in horizontals], (outer[1], outer[3]))
    groups, label = regions(verticals, horizontals, xs, ys)

    exterior = label[0][0]
    profile = _profile_width(outer, xs, ys, bool(arches))

    panes = []
    for tag, cells in enumerate(groups):
        if tag == exterior:
            continue
        box = [
            min(xs[i] for i, _ in cells),
            min(ys[j] for _, j in cells),
            max(xs[i + 1] for i, _ in cells),
            max(ys[j + 1] for _, j in cells),
        ]
        columns = {i for i, _ in cells}
        rows = {j for _, j in cells}
        # A ring — a frame, an impost, a sash — leaves a hole in its own box.
        if len(cells) != len(columns) * len(rows):
            continue
        if box[2] - box[0] < profile * 1.9 or box[3] - box[1] < profile * 1.9:
            continue
        panes.append({"box": [round(v, 2) for v in box], "opening": "fixed", "hinge": None})

    arch = _arch(arches, panes, profile, horizontals)
    roles = _roles(paths, profile)
    _openings(paths, panes)
    panes.sort(key=lambda p: (round(p["box"][1]), round(p["box"][0])))

    return {
        "id": name,
        "kind": kind,
        "vw": W,
        "vh": H,
        "outer": [round(v, 2) for v in outer],
        "profile": round(profile, 2),
        "arch": arch,
        "columns": _columns(panes, outer),
        "roles": roles,
        "panes": panes,
    }


def _roles(paths, profile):
    """Which paths of the drawing are hardware, and which are the variant number.

    The preview shows the drawing itself with the chosen colours on it, so the
    handles and hinges have to be separable from the frame. Both are pips about
    a profile-width across, and nothing structural is; the number is the run of
    filled glyphs sitting on one baseline at the end of the file, and it is
    dropped rather than recoloured — it belongs on a thumbnail, not on a
    half-metre drawing of the thing being ordered.
    """
    label = []
    baseline = None
    for index in range(len(paths) - 1, -1, -1):
        path = paths[index]
        if not path["subs"] or path["attrs"].get("fill") != INK or path["attrs"].get("stroke"):
            break
        box = path_box(path["subs"])
        if baseline is None:
            baseline = (box[1], box[3])
        else:
            overlap = min(box[3], baseline[1]) - max(box[1], baseline[0])
            if overlap < 0.6 * min(box[3] - box[1], baseline[1] - baseline[0]):
                break
        label.append(index)

    # Hardware is slender rather than merely small — a lever is one profile
    # across and four long — so the test is on the short side, with a ceiling on
    # the long one to keep a mullion out.
    def pip(path):
        box = path_box(path["subs"])
        short = min(box[2] - box[0], box[3] - box[1])
        long = max(box[2] - box[0], box[3] - box[1])
        return short < profile * 0.95 and long < profile * 4.0

    hardware = [
        index for index, path in enumerate(paths)
        if index not in label
        and path["subs"]
        and path["attrs"].get("stroke") != RED
        and pip(path)
    ]
    return {"hardware": hardware, "label": sorted(label)}


def _is_arch(path, width):
    """A head light springs from two points level with each other."""
    if not any(s["curved"] for s in path["subs"]):
        return False
    box = path_box(path["subs"])
    if box[2] - box[0] < width * 0.45:
        return False
    pts = [q for s in path["subs"] for q in s["pts"]]
    closed = abs(pts[0][0] - pts[-1][0]) < 0.4 and abs(pts[0][1] - pts[-1][1]) < 0.4
    return not closed and abs(pts[0][1] - pts[-1][1]) < 1.5


def _profile_width(outer, xs, ys, arched):
    """The frame face width — the median inset from the four outer edges.

    The face is the same width all the way round, so the four insets agree
    except where an extra line (a sill, a sash lapping the frame) lands closer
    to one edge. The median ignores those; the head is skipped outright on an
    arched variant, where the first cut in is the springing line.
    """
    candidates = [
        min((x - outer[0] for x in xs if x > outer[0] + 0.5), default=99),
        min((outer[2] - x for x in xs if x < outer[2] - 0.5), default=99),
        min((outer[3] - y for y in ys if y < outer[3] - 0.5), default=99),
    ]
    if not arched:
        candidates.append(min((y - outer[1] for y in ys if y > outer[1] + 0.5), default=99))
    candidates.sort()
    middle = (candidates[len(candidates) // 2] + candidates[(len(candidates) - 1) // 2]) / 2
    return max(middle, 2.0)


def _arch(arches, panes, profile, horizontals):
    """The head light of an arched variant, described by its own inner arc."""
    if not arches:
        return None
    scored = []
    for path in arches:
        pts = [p for s in path["subs"] for p in s["pts"]]
        scored.append((max(pts[0][1], pts[-1][1]), path["attrs"]["d"], path_box(path["subs"]), pts))
    scored.sort(key=lambda c: -c[0])  # the inner arc springs lowest
    spring, d, box, _ = scored[0]

    rails = [
        y for y, lo, hi in horizontals
        if y > spring + 0.4 and lo <= box[0] + 1.5 and hi >= box[2] - 1.5
    ]
    below = [p["box"][1] for p in panes if p["box"][1] > spring - 0.5]
    foot = min(rails) if rails else (min(below) - profile if below else spring + profile)
    return {
        "d": d,
        "spring": round(spring, 2),
        "foot": round(foot, 2),
        "box": [round(v, 2) for v in box],
        "opening": "fixed",
        "hinge": None,
    }


def _openings(paths, panes):
    """Read opening type and hinge side off the red indicator lines."""
    for path in paths:
        if path["attrs"].get("stroke") != RED:
            continue
        pts = [p for s in path["subs"] for p in s["pts"]]
        box = bbox(pts)
        cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
        pane = next(
            (p for p in panes
             if p["box"][0] - 1 <= cx <= p["box"][2] + 1 and p["box"][1] - 1 <= cy <= p["box"][3] + 1),
            None,
        )
        if pane is None:
            continue
        first, last = pts[0], pts[-1]
        if abs(first[0] - last[0]) < 1.5:  # a casement triangle stands on its hinge stile
            side = "right" if abs(first[0] - pane["box"][2]) < abs(first[0] - pane["box"][0]) else "left"
            pane["opening"] = "tilt-turn" if pane["opening"] == "tilt" else "casement"
            pane["hinge"] = side
        elif abs(first[1] - last[1]) < 1.5:  # a tilt vee stands on the bottom rail
            pane["opening"] = "tilt-turn" if pane["opening"] == "casement" else "tilt"
            pane["hinge"] = pane["hinge"] or "bottom"


def _columns(panes, outer):
    """How many sashes wide the variant reads — the group it belongs to.

    Counted across the tallest run of lights, not across every light in the
    drawing: a transom is often divided more finely than the sashes under it,
    and a five-part fanlight over three sashes is still a three-sash window.
    """
    if not panes:
        return 1
    rows = []
    for pane in sorted(panes, key=lambda p: p["box"][1]):
        y0, y1 = pane["box"][1], pane["box"][3]
        for row in rows:
            overlap = min(y1, row["y1"]) - max(y0, row["y0"])
            if overlap > 0.5 * min(y1 - y0, row["y1"] - row["y0"]):
                row["items"].append(pane)
                row["y0"], row["y1"] = min(row["y0"], y0), max(row["y1"], y1)
                break
        else:
            rows.append({"y0": y0, "y1": y1, "items": [pane]})

    main = max(rows, key=lambda r: r["y1"] - r["y0"])
    spans = sorted({(p["box"][0], p["box"][2]) for p in main["items"]})
    left, right = min(s[0] for s in spans), max(s[1] for s in spans)
    count, cursor, guard = 0, left, 0
    while cursor < right - 1 and guard < 16:
        guard += 1
        ahead = [s for s in spans if s[0] <= cursor + 2.5 and s[1] > cursor + 1]
        if ahead:
            cursor = min(s[1] for s in ahead)
            count += 1
            continue
        forward = [s[0] for s in spans if s[0] > cursor + 1]
        if not forward:
            break
        cursor = min(forward)
    return max(count, 1)


def main():
    out = []
    for kind, folder, prefix, total in (("window", "windows", "win", 47), ("door", "doors", "door", 8)):
        for index in range(1, total + 1):
            vb, paths = read(CAL / folder / f"{prefix}_{index}.svg")
            out.append(analyse(f"{prefix}_{index}", kind, vb, paths))

    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n")
    # The emitted file is checked in, so it goes through the repo's formatter
    # rather than leaving `npm run format:check` failing after every run.
    subprocess.run(
        ["npx", "prettier", "--write", str(OUT)],
        cwd=OUT.parent.parent,
        check=False,
        capture_output=True,
    )

    for scheme in out:
        marks = ",".join(
            p["opening"] + (":" + p["hinge"][0] if p["hinge"] else "") for p in scheme["panes"]
        )
        print(
            f'{scheme["id"]:9} cols={scheme["columns"]} panes={len(scheme["panes"]):2} '
            f'{"arch" if scheme["arch"] else "    "} [{marks}]'
        )


if __name__ == "__main__":
    main()
