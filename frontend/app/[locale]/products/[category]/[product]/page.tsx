import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductPageView } from "@/components/products/page/product-page-view";
import {
  colorSwatches,
  findCategory,
  findProduct,
  productParams,
  type ProductBase,
} from "@/data/products";
import { joinLocalized, type LocalizedText } from "@/lib/localized";
import { localizedPairs, localizedText } from "@/lib/localized-messages";
import type { ProductFinish, ProductPageData } from "@/types/product-page";

const CONTACTS_ANCHOR = "#contacts";
const CALCULATOR_HREF = "/calculator";
const PRODUCTS_HREF = "/products";

// Photography shared by every system, from `scripts/build-page-media.py`. It is
// the Dushanbe showroom and the Dushanbe line — not this system in a customer's
// flat, which does not exist as a photograph yet. The paths sit in the page data
// rather than in the sections, so the day the client sends per-system interiors
// only this list changes.
const HERO_IMAGE = "/product-page/hero.webp";
const CALCULATOR_IMAGE = "/product-page/calculator.webp";
const GALLERY_IMAGES = [1, 2, 3, 4, 5, 6].map((index) => `/product-page/gallery/${index}.webp`);

// Which advantages carry the long read. Three, not the whole list: the block is
// prose beside a render, and the fourth paragraph is where a reader stops.
const STORY_ADVANTAGES = {
  pvc: ["thermal", "acoustic", "durability"],
  aluminium: ["strength", "spans", "weather"],
} as const;

/**
 * Every category × product pair the catalog actually claims.
 *
 * A system in two categories is two addresses — `/products/windows/roller` and
 * `/products/doors/roller` — because that is what a category segment in the URL
 * means once the link is many-to-many. Both are prerendered; a pair the catalog
 * does not claim still renders (the segment is not validated) and gets the
 * «Продукт не найден» section instead.
 */
export function generateStaticParams() {
  return productParams;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[category]/[product]">): Promise<Metadata> {
  const { locale, product: slug } = await params;
  const product = findProduct(slug);

  const t = await getTranslations({ locale, namespace: "product" });

  if (!product) {
    const tPage = await getTranslations({ locale, namespace: "productPage" });
    return { title: tPage("notFound.title") };
  }

  const tBrands = await getTranslations({ locale, namespace: "brands" });
  const tMaterials = await getTranslations({ locale, namespace: "materials" });

  const values = {
    name: tBrands(`items.${slug}.name`),
    material: tMaterials(product.material),
    depth: product.depthMm,
  };

  return {
    title: t("metaTitle", values),
    description: t("metaDescription", values),
  };
}

/**
 * `/[locale]/products/[category]/[product]` — the product page, rebuilt against
 * imzo.uz at the client's request and replacing the flat `/products/[product]`.
 *
 * ── What this file is ──────────────────────────────────────────────────────
 *
 * The whole page as one value. `buildPageData` reads `data/products.ts` and all
 * four message catalogues and returns a `ProductPageData`: seven sections, every
 * string carrying `{ru, tj, en, tr}`. `ProductPageView` holds it in state and
 * hands each section its slice, so no section knows about routes, catalogues or
 * the data layer — which is the structure the client asked for, and the seam the
 * API replaces in stage 11.
 *
 * The server half stays a server component on purpose: `generateStaticParams`,
 * `generateMetadata` and the prerender are worth more than the symmetry of
 * marking the file `"use client"`.
 *
 * ── The category segment ───────────────────────────────────────────────────
 *
 * It is not validated against the product. `/products/doors/roller` and
 * `/products/windows/roller` are both real, and so is any other spelling of the
 * category — the client's decision. Only an unknown *product* or an unknown
 * category turns the page into the «Продукт не найден» section, and neither
 * calls `notFound()`.
 */
export default async function ProductPage({
  params,
}: PageProps<"/[locale]/products/[category]/[product]">) {
  const { locale, category, product } = await params;
  setRequestLocale(locale);

  return <ProductPageView initialData={buildPageData(category, product)} />;
}

function buildPageData(categorySlug: string, productSlug: string): ProductPageData {
  const product = findProduct(productSlug);
  const category = findCategory(categorySlug);

  if (!product || !category) {
    return {
      status: "not-found",
      category: categorySlug,
      product: productSlug,
      notFound: {
        id: "not-found",
        title: localizedText("productPage.notFound.title"),
        description: localizedText("productPage.notFound.description"),
        actions: [
          {
            label: localizedText("productPage.notFound.catalog"),
            href: PRODUCTS_HREF,
            tone: "primary",
          },
          { label: localizedText("productPage.notFound.home"), href: "/", tone: "outline" },
        ],
      },
    };
  }

  const name = localizedText(`brands.items.${productSlug}.name`);
  const material = joinLocalized([
    localizedText(`materials.${product.material}`),
    ...(product.materialNote ? [localizedText(`materialNotes.${product.materialNote}`)] : []),
  ]);

  return {
    status: "found",
    category: category.slug,
    product: product.slug,
    sections: {
      hero: {
        id: "overview",
        title: name,
        description: localizedText(`products.items.${productSlug}.description`),
        media: [{ src: HERO_IMAGE, alt: localizedText("productPage.hero.imageAlt") }],
        // One white button, as on the reference. The calculator has its own
        // block further down the page and does not need a second pill here.
        actions: [
          {
            label: localizedText("productPage.hero.order"),
            href: CONTACTS_ANCHOR,
            tone: "light",
          },
        ],
      },

      // No heading: the reference's swatch block is swatches and a picture.
      finishes: {
        id: "finishes",
        finishes: finishesOf(product, name),
        // ЭКОЛАЙН, and only ЭКОЛАЙН: the brief says «ТОЛЬКО БЕЛЫЙ», and one
        // swatch without a sentence beside it reads as missing data.
        note: product.colors.length === 1 ? localizedText("product.colors.single") : undefined,
        placeholder: localizedText("product.imagePlaceholder", { name }),
      },

      specs: {
        id: "specs",
        title: localizedText("product.specs.eyebrow"),
        // «Тип профиля» first, as on the reference, and it is the one row the
        // catalogue does not carry: material is a field on the product, not a
        // spec pair, because the calculator filters on it.
        specs: [
          { name: localizedText("productPage.specs.material"), value: material },
          ...localizedPairs(`products.items.${productSlug}.specs`),
        ],
        media: [
          {
            src: `/products/corners/${product.colors[0]}.webp`,
            alt: localizedText("productPage.specs.cornerAlt", { name }),
          },
        ],
      },

      story: {
        id: "about",
        title: localizedText("productPage.story.title", { name }),
        paragraphs: [
          localizedText(`products.items.${productSlug}.heading`),
          ...STORY_ADVANTAGES[product.material].map((key) =>
            localizedText(`product.advantages.${product.material}.${key}.description`),
          ),
        ],
        // No button: the block is the long read, and the reference closes it
        // with the text rather than with a call to action.
        media: renderOf(product, name),
      },

      // Pictures only, like the reference's band — no heading over it.
      gallery: {
        id: "showroom",
        media: GALLERY_IMAGES.map((src, index) => ({
          src,
          alt: localizedText("productPage.gallery.imageAlt", { index: index + 1 }),
        })),
        controls: {
          previous: localizedText("productPage.gallery.previous"),
          next: localizedText("productPage.gallery.next"),
        },
      },

      promo: {
        id: "price",
        title: localizedText("productPage.promo.title"),
        description: localizedText("productPage.promo.description"),
        media: [{ src: CALCULATOR_IMAGE, alt: localizedText("productPage.promo.imageAlt") }],
        actions: [
          { label: localizedText("productPage.promo.cta"), href: CALCULATOR_HREF, tone: "primary" },
        ],
      },

      contacts: {
        id: "contacts",
        title: localizedText("productPage.contacts.title"),
        description: localizedText("productPage.contacts.description", { name }),
        context: localizedText("productPage.contacts.context", { name }),
      },
    },
  };
}

/**
 * The swatch row, and the render each swatch shows.
 *
 * Built from `gallery` where renders exist and from `colors` where they do not:
 * ЭКОЛАЙН has a palette of one and no photography at all, and a colour with no
 * render still has to appear — the palette is a fact about the system, not
 * about the folder the client sent.
 */
function finishesOf(product: ProductBase, name: LocalizedText): ProductFinish[] {
  return product.colors.map((color) => {
    const colorway = product.gallery.find((entry) => entry.color === color);
    const label = localizedText(`colors.${color}`);

    return {
      color,
      swatch: colorSwatches[color] ?? "#e5e5e5",
      label,
      image: colorway?.images[0]
        ? {
            src: colorway.images[0],
            alt: localizedText("product.imageAlt", { name, color: label }),
          }
        : null,
    };
  });
}

/** The render beside the long read: the first frame of the first colourway. */
function renderOf(product: ProductBase, name: LocalizedText) {
  const source = product.gallery[0]?.images[0] ?? product.images[0];
  if (!source) return undefined;

  return [
    {
      src: source,
      alt: localizedText("product.imageAlt", {
        name,
        color: localizedText(`colors.${product.gallery[0]?.color ?? product.colors[0]}`),
      }),
    },
  ];
}
