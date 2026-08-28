#!/usr/bin/env python3
"""
Builds `backend/app/seeds/products.json` — the six systems the site shipped
with, as products-with-sections the backend can insert.

Run from the repository root:

    python3 scripts/build-products-seed.py

── Why a generator and not a hand-written JSON ────────────────────────────────

The copy already exists, four times over, in `frontend/messages/{ru,tj,en,tr}
.json`, and the page that reads it (`app/[locale]/products/[category]/[product]
/page.tsx`, before this migration) assembled it with a specific set of rules:
which advantages carry the long read, which spec row goes first, which render
sits beside which swatch. Retyping all of that by hand into a JSON file is how
the seed ends up quietly saying something different from what the site said.

── Why the catalogue is inline below ─────────────────────────────────────────

The locale-independent half — palettes, render paths, category membership —
lives in `frontend/data/products.ts`, which is TypeScript. Rather than parse it,
this script mirrors it as Python literals. It is a one-shot: the seed is
generated once, committed, and the products become the admin's to edit. If
`data/products.ts` and this file ever disagree, the JSON that was committed is
what the database holds — this script is a record of how it was built, not a
live import.
"""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MESSAGES_DIR = ROOT / "frontend" / "messages"
OUTPUT = ROOT / "backend" / "app" / "seeds" / "products.json"

LOCALES = ("ru", "tj", "en", "tr")

# ── The locale-independent catalogue, mirroring `frontend/data/products.ts` ──

PVC_PALETTE = ["white", "light-oak", "golden-oak", "nut", "dark-oak", "grey", "anthracite"]
ALUMINIUM_PALETTE = ["white", "golden-oak", "brown", "anthracite"]

COLOR_SWATCHES = {
    "white": "#f2f2f0",
    "light-oak": "#c3af92",
    "golden-oak": "#b08a30",
    "nut": "#5f412b",
    "dark-oak": "#3e2a1c",
    "grey": "#8f8a80",
    "anthracite": "#3a4344",
    "brown": "#57423a",
}

# Which advantages carry the long read. Three, not the whole list — the block
# is prose beside a render, and the fourth paragraph is where a reader stops.
STORY_ADVANTAGES = {
    "pvc": ["thermal", "acoustic", "durability"],
    "aluminium": ["strength", "spans", "weather"],
}

# Photography shared by every system, from the page as it stood.
GALLERY_IMAGES = [f"/product-page/gallery/{index}.webp" for index in range(1, 7)]
PROMO_IMAGE = "/product-page/calculator.webp"
CALCULATOR_HREF = "/calculator"

PRODUCTS = [
    {
        "slug": "ecoline",
        "material": "pvc",
        "material_note": None,
        "colors": ["white"],
        # ⚠️ The client sent renders for five of the six systems; there is no
        # ЭКОЛАЙН folder at all. Card, hero and swatch renders are all empty
        # here, and every block that draws them falls back to a placeholder.
        "image": None,
        "gallery_angles": {},
        "categories": ["windows", "doors"],
    },
    {
        "slug": "roller",
        "material": "pvc",
        "material_note": None,
        "colors": PVC_PALETTE,
        "image": "/products/roller/roller-main.png",
        "gallery_angles": {color: 5 for color in PVC_PALETTE},
        "categories": ["windows", "doors"],
    },
    {
        "slug": "unopen",
        "material": "pvc",
        "material_note": None,
        "colors": PVC_PALETTE,
        "image": "/products/unopen/unopen-main.png",
        # White is three angles, not five: one source file was an anthracite
        # window filed in the white folder and was dropped rather than shipped.
        "gallery_angles": {**{color: 5 for color in PVC_PALETTE}, "white": 3},
        "categories": ["windows", "doors", "sliding-systems"],
    },
    {
        "slug": "stella",
        "material": "pvc",
        "material_note": None,
        "colors": PVC_PALETTE,
        "image": "/products/stella/stella-main.png",
        "gallery_angles": {color: 5 for color in PVC_PALETTE},
        "categories": ["windows", "doors"],
    },
    {
        "slug": "ald-45",
        "material": "aluminium",
        "material_note": "cold",
        "colors": ALUMINIUM_PALETTE,
        "image": "/products/ald-45/ald-45-white.png",
        "gallery_angles": {color: 5 for color in ALUMINIUM_PALETTE},
        "categories": ["doors", "sliding-systems", "facade-glazing", "partitions"],
    },
    {
        "slug": "thermo-60",
        "material": "aluminium",
        "material_note": "warm",
        "colors": ALUMINIUM_PALETTE,
        "image": "/products/thermo-60/thermo-60-anthracite.png",
        "gallery_angles": {color: 5 for color in ALUMINIUM_PALETTE},
        "categories": ["windows", "doors", "sliding-systems", "facade-glazing"],
    },
]


def load_messages() -> dict[str, dict]:
    return {
        locale: json.loads((MESSAGES_DIR / f"{locale}.json").read_text(encoding="utf-8"))
        for locale in LOCALES
    }


class Catalogue:
    """Reads one dotted key out of all four message files at once."""

    def __init__(self, messages: dict[str, dict]) -> None:
        self.messages = messages

    def _raw(self, locale: str, key: str):
        node = self.messages[locale]
        for part in key.split("."):
            node = node[part]
        return node

    def text(self, key: str, **values: str) -> dict[str, str]:
        """A `{ru, tj, en, tr}` object, with `{name}`-style placeholders filled."""
        out = {}
        for locale in LOCALES:
            value = self._raw(locale, key)
            for placeholder, replacement in values.items():
                value = value.replace("{" + placeholder + "}", replacement[locale])
            out[locale] = value
        return out

    def join(self, parts: list[dict[str, str]], separator: str = " · ") -> dict[str, str]:
        return {
            locale: separator.join(part[locale] for part in parts if part[locale])
            for locale in LOCALES
        }

    def pairs(self, key: str) -> list[dict[str, dict[str, str]]]:
        """`[{name, value}]` where both halves carry all four locales."""
        rows = self._raw(LOCALES[0], key)
        out = []
        for index in range(len(rows)):
            out.append(
                {
                    "name": {loc: self._raw(loc, key)[index]["name"] for loc in LOCALES},
                    "value": {loc: self._raw(loc, key)[index]["value"] for loc in LOCALES},
                }
            )
        return out


def gallery_of(product: dict, color: str) -> list[str]:
    angles = product["gallery_angles"].get(color)
    if not angles:
        return []
    return [f"/products/{product['slug']}/{color}/{i + 1}.webp" for i in range(angles)]


def build_product(product: dict, cat: Catalogue) -> dict:
    slug = product["slug"]
    name = cat.text(f"brands.items.{slug}.name")

    material = cat.join(
        [cat.text(f"materials.{product['material']}")]
        + ([cat.text(f"materialNotes.{product['material_note']}")] if product["material_note"] else [])
    )

    # `finishes` — one swatch per lamination, and the render wearing it. Built
    # from `colors` rather than from the renders on disk: the palette is a fact
    # about the system, and a colour with no photography still belongs in the
    # row.
    finishes = {
        "items": [
            {
                "color": COLOR_SWATCHES.get(color, "#e5e5e5"),
                "label": cat.text(f"colors.{color}"),
                "image": (gallery_of(product, color) or [None])[0],
            }
            for color in product["colors"]
        ]
    }
    if len(product["colors"]) == 1:
        # ЭКОЛАЙН, and only ЭКОЛАЙН: «ТОЛЬКО БЕЛЫЙ», and one swatch without a
        # sentence beside it reads as missing data.
        finishes["note"] = cat.text("product.colors.single")

    # `specs` — «Тип профиля» first, as on the reference. It is the one row the
    # catalogue never carried as a spec pair: material is a field on the
    # product, because the calculator filters on it.
    specs = {
        "title": cat.text("product.specs.eyebrow"),
        "image": f"/products/corners/{product['colors'][0]}.webp",
        "rows": [{"name": cat.text("productPage.specs.material"), "value": material}]
        + cat.pairs(f"products.items.{slug}.specs"),
    }

    story_render = next(
        (image for color in product["colors"] for image in gallery_of(product, color)),
        product["image"],
    )
    story = {
        "title": cat.text("productPage.story.title", name=name),
        "image": story_render,
        "paragraphs": [cat.text(f"products.items.{slug}.heading")]
        + [
            cat.text(f"product.advantages.{product['material']}.{key}.description")
            for key in STORY_ADVANTAGES[product["material"]]
        ],
    }

    promo = {
        "title": cat.text("productPage.promo.title"),
        "description": cat.text("productPage.promo.description"),
        "image": PROMO_IMAGE,
        "button_label": cat.text("productPage.promo.cta"),
        "button_href": CALCULATOR_HREF,
    }

    return {
        "slug": slug,
        "image_path": product["image"],
        "title": name,
        "description": cat.text(f"products.items.{slug}.description"),
        "category_titles": [cat.text(f"categories.items.{c}.title") for c in product["categories"]],
        # The order the page rendered before this migration. It is only a
        # starting point now — the admin panel is what decides it from here on.
        "sections": [
            {"type": "finishes", "content": finishes},
            {"type": "specs", "content": specs},
            {"type": "story", "content": story},
            {"type": "gallery", "content": {"images": GALLERY_IMAGES}},
            {"type": "promo", "content": promo},
        ],
    }


def main() -> None:
    cat = Catalogue(load_messages())
    payload = [build_product(product, cat) for product in PRODUCTS]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(payload)} products to {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
