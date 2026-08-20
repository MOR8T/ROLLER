#!/usr/bin/env python3
"""
Photography for the product page, decoded from the client's originals.

Source: `notes/` — gitignored, 1.1 GB of RAW-sized JPEGs and 17000px PNGs.
Output: `frontend/public/product-page/…` and `frontend/public/products/corners/…`.

Run from the repository root:

    python3 frontend/scripts/build-page-media.py

Same contract as `build-product-renders.py`: the output is committed, so this
file is the record of *which* original became which asset — nobody can re-run
it without the client's folders.

--------------------------------------------------------------------------
What comes from where
--------------------------------------------------------------------------
`notes/ugalok/` holds profile corners — one cutaway of the sash, the frame and
the glazing unit, rendered per lamination. The filenames are not colour codes
(`уголак 3`, `AnthraciteTeks`), so `CORNERS` below is a reading of the renders
themselves, in the vocabulary `data/products.ts` already uses for swatches. The
280px files are ignored: they are thumbnails of the same renders and the specs
block draws the corner at half the width of the page.

`notes/photos/` is the Dushanbe showroom. Six wide frames become the gallery
slider, one corridor shot becomes the page's opening image, and one frame of
the production line carries the calculator block — the only place on this page
where a photograph is asked to mean "we make this ourselves".

Alpha survives into WebP for the corners, so the cutaway sits on whichever
ground the section gives it; the photographs are opaque and lossy.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

# The 17000x11397 corner renders are legitimate, not decompression bombs.
Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parents[2]
NOTES = ROOT / "notes"
PUBLIC = ROOT / "frontend" / "public"

# Colour key -> file in `notes/ugalok`. Keys are `colorSwatches` in
# `data/products.ts`; every colour either palette uses has an entry, because a
# missing one would fall back to white and quietly show the wrong profile.
CORNERS = {
    "white": "уголак 12.png",
    "light-oak": "уголак 15.png",
    "golden-oak": "уголак 11.png",
    "nut": "уголак 5.png",
    "dark-oak": "уголак 14.png",
    "grey": "уголак 4.png",
    "anthracite": "уголак 16.png",
    "brown": "уголак 3.png",
}

# Showroom frames for the gallery slider, in display order.
GALLERY = [
    "BOB04347.jpg",
    "BOB04351.jpg",
    "BOB04355.jpg",
    "BOB04359.jpg",
    "BOB04436.jpg",
    "BOB04437.jpg",
]

HERO = "BOB04527.jpg"
PROMO = "DSC08072.jpg"

CORNER_WIDTH = 1100
HERO_WIDTH = 2000
PHOTO_WIDTH = 1500


def load(path: Path, target_width: int) -> Image.Image:
    image = Image.open(path)
    # `draft` lets libjpeg decode a 6000px frame at a quarter size instead of
    # allocating 24 MP we immediately throw away.
    image.draft("RGB", (target_width * 2, target_width * 2))
    return image


def save_photo(source: Path, destination: Path, width: int) -> None:
    image = load(source, width).convert("RGB")
    if image.width > width:
        height = round(image.height * width / image.width)
        image = image.resize((width, height), Image.LANCZOS)

    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=72, method=6)
    print(f"{destination.relative_to(PUBLIC)}  {image.width}x{image.height}")


def save_corner(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGBA")

    # Trim the transparent margin first: the renders are square canvases with
    # the corner floating in the middle, and cropping is what makes two colours
    # line up at the same size in the layout.
    bbox = image.getchannel("A").getbbox()
    if bbox:
        image = image.crop(bbox)

    if image.width > CORNER_WIDTH:
        height = round(image.height * CORNER_WIDTH / image.width)
        image = image.resize((CORNER_WIDTH, height), Image.LANCZOS)

    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=82, method=6)
    print(f"{destination.relative_to(PUBLIC)}  {image.width}x{image.height}")


def main() -> int:
    if not NOTES.is_dir():
        print(f"notes/ not found at {NOTES} — nothing to build", file=sys.stderr)
        return 1

    for color, filename in CORNERS.items():
        save_corner(NOTES / "ugalok" / filename, PUBLIC / "products" / "corners" / f"{color}.webp")

    save_photo(NOTES / "photos" / HERO, PUBLIC / "product-page" / "hero.webp", HERO_WIDTH)
    save_photo(NOTES / "photos" / PROMO, PUBLIC / "product-page" / "calculator.webp", PHOTO_WIDTH)

    for index, filename in enumerate(GALLERY, start=1):
        save_photo(
            NOTES / "photos" / filename,
            PUBLIC / "product-page" / "gallery" / f"{index}.webp",
            PHOTO_WIDTH,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
