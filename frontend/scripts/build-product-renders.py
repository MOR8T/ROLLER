#!/usr/bin/env python3
"""
Turn the client's product renders into web assets.

Source: `notes/Brands products/` — 622 MB of 3000x3000 RGBA PNGs, gitignored.
Output: `frontend/public/products/<slug>/…` — trimmed, resized, lossy WebP.

Run from the repository root:

    python3 frontend/scripts/build-product-renders.py

Idempotent: it rewrites whatever it finds and touches nothing else. The output
is committed, so this script is a record of *where the pixels came from* rather
than a build step — `notes/` is not in the repository and nobody can re-run it
without the client's originals.

--------------------------------------------------------------------------
Structure of the source, decoded
--------------------------------------------------------------------------
The PVC brands (ROLLER, STELLA, UNOPEN) ship folders `1…7`. Each folder is one
**lamination colour**; inside it, `CADR n` is one **camera angle of the same
construction**. The folder numbers are *not* a shared code — folder 3 is
anthracite for ROLLER, light oak for STELLA and dark oak for UNOPEN — so the
mapping below was read off the renders themselves (frame colour sampled on the
opaque pixels of `CADR 5`, the front view of the double-sash window) rather than
assumed. `COLOURWAYS` is that reading, and it is the only place it exists.

`CADR` numbers *are* consistent across brands and colours:

    1, 7, 8  cutaways and profile sections — the "technical" layer of
             DESIGN.md §6, shown to architects and dealers, never on the
             first screen
    2 3 4 5 6  the assembled construction from five angles — the gallery

The aluminium brands (HOLODNIY = АЛД-45, THERMO = ТЕРМО 60) name their folders
by colour already, and their files are angles with production names. They have
no cutaway render at all, so those products carry an empty `sections` list and
the page drops the technical block for them.
"""

from __future__ import annotations

import re
import shutil
import sys
import unicodedata
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "notes" / "Brands products"
TARGET = ROOT / "frontend" / "public" / "products"

# Longest side of the emitted asset. The originals are 3000x3000; `next/image`
# re-encodes to AVIF/WebP per breakpoint and the largest slot on the product
# page is a ~880px gallery frame on a 2x screen, so 1600 is a full stop of
# headroom and still ~40x smaller than the PNG.
MAX_EDGE = 1600
QUALITY = 82

# Fraction of the trimmed subject kept as breathing room on every side, so the
# construction does not touch the edge of the frame it is drawn into.
MARGIN = 0.03

# --------------------------------------------------------------------------
# PVC
# --------------------------------------------------------------------------

# folder -> colour key. Read off the renders; see the module docstring.
COLOURWAYS: dict[str, dict[str, str]] = {
    "roller": {
        "1": "dark-oak",
        "2": "golden-oak",
        "3": "anthracite",
        "4": "light-oak",
        "5": "nut",
        "6": "grey",
        "7": "white",
    },
    "stella": {
        "1": "grey",
        "2": "nut",
        "3": "light-oak",
        "4": "anthracite",
        "5": "golden-oak",
        "6": "dark-oak",
        "7": "white",
    },
    "unopen": {
        "1": "grey",
        "2": "nut",
        "3": "dark-oak",
        "4": "golden-oak",
        "5": "anthracite",
        "6": "light-oak",
        "7": "white",
    },
}

PVC_DIRS = {"roller": "ROLLER", "stella": "STELLA", "unopen": "UNOPEN"}

# Gallery angles, best first: the front view of the двустворчатое window reads
# as "a window" to someone who has never seen a profile drawing, which is the
# whole point of the product layer in DESIGN.md §6. The cutaways are held back
# for the technical block.
PVC_GALLERY_ORDER = [5, 3, 4, 2, 6]
PVC_SECTION_ORDER = [1, 7, 8]

# `UNOPEN/7` is the white colourway, and this one file in it is an anthracite
# double-sash window — the wrong render in the wrong folder. Dropped rather
# than shipped as "white". Worth raising with the client: two more files in
# that folder show a white sash in a grey outer frame, which may be a genuine
# two-tone product or may be the same mix-up.
EXCLUDE = {("unopen", "7", "CADR 5.png")}

# --------------------------------------------------------------------------
# Aluminium
# --------------------------------------------------------------------------

ALU_DIRS = {"ald-45": "HOLODNIY ", "thermo-60": "THERMO"}

# The colour folders are named, so no decoding needed — only transliteration.
# Note "ЗОЛОТОЙ ДУб"/"ЗОЛОТОЙ" and "АНТАРЦИТ"/"АНТРАЦИТ": the two brands spell
# the same two colours differently, hence one entry per literal spelling.
ALU_COLOURS = {
    "АНТАРЦИТ": "anthracite",
    "АНТРАЦИТ": "anthracite",
    "БЕЛЫЙ": "white",
    "ЗОЛОТОЙ ДУб": "golden-oak",
    "ЗОЛОТОЙ": "golden-oak",
    "КОРИЧНЕВЫЙ": "brown",
}

# Same idea as `PVC_GALLERY_ORDER`, over the aluminium file names. `Layer 1` is
# how the anthracite folder spells `1_0093`. `2_0013` is the edge-on view — it
# shows profile depth but is not a cutaway, so it closes the gallery instead of
# pretending to be a section drawing.
ALU_GALLERY_ORDER = ["5_0093", "3_0091", "1_0093", "Layer 1", "4_0093", "2_0013"]


def emit(source: Path, destination: Path) -> None:
    """Trim to the subject, fit inside `MAX_EDGE`, write lossy WebP with alpha."""
    image = Image.open(source).convert("RGBA")

    box = image.getchannel("A").getbbox()
    if box:
        pad_x = round((box[2] - box[0]) * MARGIN)
        pad_y = round((box[3] - box[1]) * MARGIN)
        image = image.crop(
            (
                max(0, box[0] - pad_x),
                max(0, box[1] - pad_y),
                min(image.width, box[2] + pad_x),
                min(image.height, box[3] + pad_y),
            )
        )

    image.thumbnail((MAX_EDGE, MAX_EDGE), Image.LANCZOS)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=QUALITY, method=6)


def cadr_number(path: Path) -> int | None:
    """`CADR 5.png` -> 5. `CADR 1 1.png` (a duplicate take) -> 1."""
    match = re.match(r"CADR (\d+)", path.stem)
    return int(match.group(1)) if match else None


def build_pvc(slug: str, folder: str, report: list[str]) -> None:
    for number, colour in sorted(COLOURWAYS[slug].items()):
        source_dir = SOURCE / folder / number
        by_cadr: dict[int, Path] = {}
        for file in sorted(source_dir.glob("*.png")):
            if (slug, number, file.name) in EXCLUDE:
                continue
            cadr = cadr_number(file)
            # `setdefault`: `CADR 1 1.png` is a second take of `CADR 1`, and the
            # plain name sorts first, so the canonical one wins.
            if cadr is not None:
                by_cadr.setdefault(cadr, file)

        gallery = [by_cadr[c] for c in PVC_GALLERY_ORDER if c in by_cadr]
        for index, file in enumerate(gallery, start=1):
            emit(file, TARGET / slug / colour / f"{index}.webp")
        report.append(f"  {slug}/{colour}: {len(gallery)} angles")

        # Sections are a property of the system, not of the colour, so only one
        # colourway contributes them — the first that has any.
        sections = [by_cadr[c] for c in PVC_SECTION_ORDER if c in by_cadr]
        if sections and not (TARGET / slug / "section-1.webp").exists():
            for index, file in enumerate(sections, start=1):
                emit(file, TARGET / slug / f"section-{index}.webp")
            report.append(f"  {slug}: {len(sections)} sections (from {colour})")


def build_aluminium(slug: str, folder: str, report: list[str]) -> None:
    for source_dir in sorted((SOURCE / folder).iterdir()):
        if not source_dir.is_dir():
            continue
        # macOS hands back NFD ("И" as И + U+0306), the literals above are NFC.
        colour = ALU_COLOURS[unicodedata.normalize("NFC", source_dir.name).strip()]
        by_name = {file.stem: file for file in source_dir.glob("*.png")}
        gallery = [by_name[name] for name in ALU_GALLERY_ORDER if name in by_name]
        for index, file in enumerate(gallery, start=1):
            emit(file, TARGET / slug / colour / f"{index}.webp")
        report.append(f"  {slug}/{colour}: {len(gallery)} angles")


def main() -> int:
    if not SOURCE.is_dir():
        print(f"Source renders not found at {SOURCE}", file=sys.stderr)
        print("They are gitignored — ask the client for `notes/`.", file=sys.stderr)
        return 1

    report: list[str] = []
    for slug, folder in list(PVC_DIRS.items()) + list(ALU_DIRS.items()):
        # Clear only what this script owns. The hand-picked `*-main.png` card
        # renders live in the same directories and are not ours to delete.
        for stale in (TARGET / slug).glob("*/"):
            shutil.rmtree(stale, ignore_errors=True)
        for stale in (TARGET / slug).glob("section-*.webp"):
            stale.unlink()
        if slug in PVC_DIRS:
            build_pvc(slug, folder, report)
        else:
            build_aluminium(slug, folder, report)

    print("\n".join(report))
    total = sum(f.stat().st_size for f in TARGET.rglob("*.webp"))
    count = sum(1 for _ in TARGET.rglob("*.webp"))
    print(f"\n{count} files, {total / 1_048_576:.1f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
