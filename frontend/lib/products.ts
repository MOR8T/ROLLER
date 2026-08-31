import { hasLocale } from "next-intl";

import { defaultLocale, routing, type Locale } from "@/i18n/routing";
import { BACKEND_API_URL } from "@/lib/admin-auth";
import type { LocalizedText } from "@/lib/localized";
import { productCategoryHref, type ProductsMenuCategory } from "@/lib/product-links";
import { localizedText } from "@/lib/localized-messages";
import type {
  ProductFinish,
  ProductHeroJump,
  ProductHeroTrail,
  ProductPageBlock,
  ProductPageData,
  ProductMedia,
} from "@/types/product-page";

/**
 * The product section's data access layer.
 *
 * ⚠️ **Server-only** — it imports `lib/localized-messages.ts`, which pulls all
 * four message catalogues. A client component that imports this file ships a
 * quarter of a megabyte of JSON to the browser.
 *
 * Everything the site knows about products comes through the four functions
 * below. Products are managed from the admin panel
 * (`app/admin/(dashboard)/products/`) and stored in the backend as a photo, a
 * title and a description per locale, plus an ordered list of content sections
 * — see `backend/app/models/product.py`.
 *
 * Three rules keep that split honest:
 *
 *   1. **Nothing outside this file reads `/api/products` directly.** Pages call
 *      these functions; components take the DTOs as props.
 *   2. **The API carries content, the message catalogue carries chrome.** Text
 *      the admin writes (a spec row, a paragraph, a button label) comes from
 *      the backend. Text that is the same on every product page — the
 *      calculator pitch, the gallery's arrow labels, the «Продукт не найден»
 *      block, every `alt` — stays in `messages/*.json` and is read here, once,
 *      while the page is being assembled.
 *   3. **A failure is an empty result, never a fabricated one.** An unreachable
 *      backend yields `[]` or a `not-found` page, and the caller decides what
 *      to show.
 */

// The one calculator pitch, identical on every product page — see
// `ProductPageData.promo`'s doc comment in `types/product-page.ts` for why
// this is no longer admin content.
const PROMO_IMAGE = "/product-page/calculator.webp";
const PROMO_HREF = "/calculator";

interface RawProductCategory {
  id: number;
  name_ru: string;
  name_tj: string;
  name_en: string;
  name_tr: string;
  image_path: string;
  position: number;
}

interface RawProduct {
  id: number;
  image_path: string | null;
  title_ru: string;
  title_tj: string;
  title_en: string;
  title_tr: string;
  description_ru: string;
  description_tj: string;
  description_en: string;
  description_tr: string;
  position: number;
  categories: RawProductCategory[];
}

interface RawProductSection {
  id: number;
  type: string;
  position: number;
  content: Record<string, unknown>;
}

interface RawProductDetail extends RawProduct {
  sections: RawProductSection[];
}

/**
 * Admin uploads and seeded files are both served from this app's own origin,
 * so an API path needs nothing done to it — `/uploads/...` is answered by
 * nginx in production and by `next.config.ts`'s rewrite everywhere else, and
 * `next/image` optimises it like any local file. See that rewrite's comment
 * for why the absolute-URL version had to go.
 *
 * Kept as a function rather than inlined: this is the seam a CDN prefix would
 * be added at, and every DTO in this file already goes through it.
 */
function resolveImageSrc(path: string): string {
  return path;
}

function resolveLocale(locale: string): Locale {
  return hasLocale(routing.locales, locale) ? locale : defaultLocale;
}

/**
 * The four locale columns of one field, as the `LocalizedText` the page wants.
 *
 * `object` rather than a per-row type: it is called with a product and with a
 * category, whose only common shape is "has `<field>_<locale>` keys", and a
 * union of the two would have to be widened again for the next table.
 */
function textOf(row: object, field: string): LocalizedText {
  const source = row as Record<string, unknown>;

  return {
    ru: String(source[`${field}_ru`] ?? ""),
    tj: String(source[`${field}_tj`] ?? ""),
    en: String(source[`${field}_en`] ?? ""),
    tr: String(source[`${field}_tr`] ?? ""),
  };
}

/**
 * A `{ru, tj, en, tr}` object out of a section's JSON payload.
 *
 * Payloads are validated on write (`backend/app/schemas/product.py`), so a
 * well-formed one always has all four. This still guards, because a section
 * written before a payload model changed shape is readable and must not take
 * the page down with it.
 */
function localizedOf(value: unknown): LocalizedText {
  const source = (value ?? {}) as Record<string, unknown>;
  const ru = String(source.ru ?? "");

  return {
    ru,
    tj: String(source.tj ?? "") || ru,
    en: String(source.en ?? "") || ru,
    tr: String(source.tr ?? "") || ru,
  };
}

function optionalLocalizedOf(value: unknown): LocalizedText | undefined {
  return value ? localizedOf(value) : undefined;
}

function mediaOf(path: unknown, alt: LocalizedText): ProductMedia | null {
  return typeof path === "string" && path ? { src: resolveImageSrc(path), alt } : null;
}

// ── Reads ──────────────────────────────────────────────────────────────────

async function loadProducts(categoryId?: number): Promise<RawProduct[]> {
  const query = categoryId === undefined ? "" : `?category_id=${categoryId}`;

  try {
    const res = await fetch(`${BACKEND_API_URL}/api/products${query}`, {
      next: { revalidate: 60, tags: ["products"] },
    });
    if (!res.ok) return [];

    const data: RawProduct[] = await res.json();
    return data.slice().sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

async function loadProduct(productId: number): Promise<RawProductDetail | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/products/${productId}`, {
      next: { revalidate: 60, tags: ["products"] },
    });
    if (!res.ok) return null;

    return (await res.json()) as RawProductDetail;
  } catch {
    return null;
  }
}

async function loadCategories(): Promise<RawProductCategory[]> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/api/product-categories`, {
      next: { revalidate: 60, tags: ["product-categories"] },
    });
    if (!res.ok) return [];

    const data: RawProductCategory[] = await res.json();
    return data.slice().sort((a, b) => a.position - b.position);
  } catch {
    return [];
  }
}

// ── The card ───────────────────────────────────────────────────────────────

/**
 * A product as it appears in a list: the photo, title and description the
 * admin fills in when creating it, and nothing else.
 *
 * `image` is nullable — ЭКОЛАЙН has no render at all — and the card renders
 * `MediaFrame`'s placeholder in that case rather than a broken picture.
 */
export interface ProductCardDto {
  id: number;
  title: string;
  description: string;
  image: string | null;
}

function toCard(raw: RawProduct, locale: Locale): ProductCardDto {
  return {
    id: raw.id,
    title: textOf(raw, "title")[locale],
    description: textOf(raw, "description")[locale],
    image: raw.image_path ? resolveImageSrc(raw.image_path) : null,
  };
}

/** One category and the products listed in it, in the admin's order. */
export interface ProductCategoryPageDto {
  id: number;
  name: string;
  image: string;
  products: ProductCardDto[];
}

/**
 * `/[locale]/products/[category]` — the category page.
 *
 * Returns null only when the category itself does not exist; a category with
 * no products yet is a real, normal state (it is what a category looks like
 * between being created and being filled) and comes back with an empty list.
 */
export async function getProductCategoryPage(
  locale: string,
  categoryId: number,
): Promise<ProductCategoryPageDto | null> {
  const key = resolveLocale(locale);
  const categories = await loadCategories();
  const category = categories.find((item) => item.id === categoryId);
  if (!category) return null;

  const products = await loadProducts(categoryId);

  return {
    id: category.id,
    name: textOf(category, "name")[key],
    image: resolveImageSrc(category.image_path),
    products: products.map((product) => toCard(product, key)),
  };
}

/** Every category id, for `generateStaticParams` on the category page. */
export async function productCategoryParams(): Promise<{ category: string }[]> {
  const categories = await loadCategories();
  return categories.map((category) => ({ category: String(category.id) }));
}

// ── The mega-menu ──────────────────────────────────────────────────────────

/**
 * The header's «Продукция» panel: a column per category, each listing the
 * products that category claims.
 *
 * Assembled in the layout (a Server Component) and passed down to the header,
 * which is a client component and cannot fetch this itself. One request for
 * the whole tree rather than one per category — the products list carries its
 * categories, so the grouping happens here.
 *
 * A category with no products is left out: an empty column in a menu is a
 * layout to design around, and this state is temporary by nature.
 */
export async function getProductsMenu(locale: string): Promise<ProductsMenuCategory[]> {
  const key = resolveLocale(locale);
  const [categories, products] = await Promise.all([loadCategories(), loadProducts()]);

  return categories
    .map((category) => ({
      id: category.id,
      name: textOf(category, "name")[key],
      products: products
        .filter((product) => product.categories.some((item) => item.id === category.id))
        .map((product) => ({ id: product.id, title: textOf(product, "title")[key] })),
    }))
    .filter((category) => category.products.length > 0);
}

// The URL builders and the menu type are client-safe and live in
// `lib/product-links.ts`; re-exported here so server code has one import.
export { productHref, productCategoryHref } from "@/lib/product-links";
export type { ProductsMenuCategory } from "@/lib/product-links";

// ── The product page ───────────────────────────────────────────────────────

/**
 * Turns one stored section into the block its component expects.
 *
 * Every `alt` and every label that is not the admin's words is read from the
 * message catalogue here, with the product's name interpolated — that is rule
 * 2 at the top of this file, and it is why a section component never has to
 * ask for a translation.
 *
 * An unrecognised `type` returns null and the block is dropped. A section
 * stored by a newer version of the backend must not blank the page.
 */
function toBlock(
  raw: RawProductSection,
  name: LocalizedText,
  anchor: string,
): ProductPageBlock | null {
  const content = raw.content ?? {};

  switch (raw.type) {
    case "finishes": {
      const items = Array.isArray(content.items) ? content.items : [];

      const finishes: ProductFinish[] = items.map((item) => {
        const entry = item as Record<string, unknown>;
        const label = localizedOf(entry.label);
        const kind = entry.kind === "texture" ? "texture" : "color";
        const alt = localizedText("product.imageAlt", { name, color: label });

        return {
          kind,
          color: kind === "color" ? String(entry.color ?? "#e5e5e5") : null,
          texture: kind === "texture" ? mediaOf(entry.texture, alt) : null,
          label,
          image: mediaOf(entry.image, alt),
        };
      });

      return {
        kind: "finishes",
        section: {
          id: anchor,
          finishes,
          note: optionalLocalizedOf(content.note),
          placeholder: localizedText("product.imagePlaceholder", { name }),
        },
      };
    }

    case "specs": {
      const rows = Array.isArray(content.rows) ? content.rows : [];
      const image = mediaOf(content.image, localizedText("productPage.specs.cornerAlt", { name }));

      return {
        kind: "specs",
        section: {
          id: anchor,
          title: localizedOf(content.title),
          specs: rows.map((row) => {
            const entry = row as Record<string, unknown>;
            return { name: localizedOf(entry.name), value: localizedOf(entry.value) };
          }),
          media: image ? [image] : undefined,
        },
      };
    }

    case "story": {
      const paragraphs = Array.isArray(content.paragraphs) ? content.paragraphs : [];
      // The product's own name as the `alt`: `product.imageAlt` is
      // «{name}, {color}» and there is no colour to name here.
      const image = mediaOf(content.image, name);

      return {
        kind: "story",
        section: {
          id: anchor,
          title: localizedOf(content.title),
          paragraphs: paragraphs.map(localizedOf),
          media: image ? [image] : undefined,
        },
      };
    }

    case "gallery": {
      const images = Array.isArray(content.images) ? content.images : [];

      return {
        kind: "gallery",
        section: {
          id: anchor,
          media: images
            .map((src, index) =>
              mediaOf(src, localizedText("productPage.gallery.imageAlt", { index: index + 1 })),
            )
            .filter((media): media is ProductMedia => media !== null),
          controls: {
            previous: localizedText("productPage.gallery.previous"),
            next: localizedText("productPage.gallery.next"),
          },
        },
      };
    }

    default:
      return null;
  }
}

/**
 * «Окна» and a link back to it — the one thing in the hero that the reference
 * has no equivalent for.
 *
 * It reads data the admin already entered (the product's categories) and adds
 * no field to the admin panel, which was the constraint: the hero got a way
 * back to the section without the person maintaining the site having anything
 * new to fill in. A product with no categories renders the hero without it.
 *
 * The category is taken from the *address*, not from the product: a system is
 * listed under several categories and therefore has several URLs, and the trail
 * has to name the list the visitor actually came from. A product whose
 * categories no longer include that id (an old link, a category deleted since)
 * falls back to its first one rather than showing nothing.
 */
function heroTrail(product: RawProductDetail, categoryId: number): ProductHeroTrail | undefined {
  const category =
    product.categories.find((entry) => entry.id === categoryId) ?? product.categories[0];
  if (!category) return undefined;

  return { category: textOf(category, "name"), href: productCategoryHref(category.id) };
}

/**
 * One anchor per block, in the order the page renders them.
 *
 * The admin's own heading is the label when the block has one — the link then
 * says the same words as the heading it lands on. `specs` and `story` carry a
 * title; `finishes` and `gallery` have none by design, so those fall back to
 * the catalogue's generic name for the kind.
 *
 * ⚠️ Built from `blocks`, i.e. *after* `toBlock` has dropped anything it did
 * not recognise, so the row can never offer an anchor to a section the page
 * decided not to draw.
 */
function heroJumps(blocks: ProductPageBlock[]): ProductHeroJump[] {
  return blocks.map((block) => ({
    id: block.section.id,
    label: block.section.title ?? localizedText(`productPage.jumps.${block.kind}`),
  }));
}

/**
 * `/[locale]/products/[category]/[product]` — the whole page in one value.
 *
 * The order of `blocks` is the order the admin put the sections in; this
 * function does not sort, group or deduplicate them. That is the entire point
 * of the feature and the one thing here that must not be "improved".
 */
export async function getProductPage(
  categoryId: number,
  productId: number,
): Promise<ProductPageData> {
  const product = await loadProduct(productId);

  if (!product) {
    return {
      status: "not-found",
      categoryId,
      productId,
      notFound: {
        id: "not-found",
        title: localizedText("productPage.notFound.title"),
        description: localizedText("productPage.notFound.description"),
        actions: [
          { label: localizedText("productPage.notFound.home"), href: "/", tone: "primary" },
        ],
      },
    };
  }

  const name = textOf(product, "title");
  const hero = mediaOf(product.image_path, localizedText("productPage.hero.imageAlt"));

  // The DOM id is the section's database id, not its kind: a product may
  // carry two galleries, and `#gallery` twice on one page is not an anchor.
  const blocks = product.sections
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((section) => toBlock(section, name, `section-${section.id}`))
    .filter((block): block is ProductPageBlock => block !== null);

  return {
    status: "found",
    categoryId,
    productId,
    hero: {
      id: "overview",
      title: name,
      description: textOf(product, "description"),
      media: hero ? [hero] : undefined,
      // No `actions`. The reference puts a white «Заказать» pill under the
      // paragraph; the client asked for this screen without it, so the button
      // is gone from the data as well as from the layout. The request block at
      // `#contacts` still closes the page.
      trail: heroTrail(product, categoryId),
      jumps: heroJumps(blocks),
      labels: {
        trail: localizedText("productPage.hero.trailLabel"),
        jumps: localizedText("productPage.hero.jumpsLabel"),
      },
    },
    blocks,
    promo: {
      id: "promo",
      title: localizedText("productPage.promo.title"),
      description: localizedText("productPage.promo.description"),
      media: [
        { src: resolveImageSrc(PROMO_IMAGE), alt: localizedText("productPage.promo.imageAlt") },
      ],
      actions: [
        { label: localizedText("productPage.promo.cta"), href: PROMO_HREF, tone: "primary" },
      ],
    },
    contacts: {
      id: "contacts",
      title: localizedText("productPage.contacts.title"),
      description: localizedText("productPage.contacts.description", { name }),
      context: localizedText("productPage.contacts.context", { name }),
    },
  };
}

/** The product's title in one locale, for `generateMetadata`. */
export async function getProductMeta(
  locale: string,
  productId: number,
): Promise<{ title: string; description: string } | null> {
  const key = resolveLocale(locale);
  const product = await loadProduct(productId);
  if (!product) return null;

  return {
    title: textOf(product, "title")[key],
    description: textOf(product, "description")[key],
  };
}

/**
 * Every `/products/[category]/[product]` pair, for `generateStaticParams`.
 *
 * A pair per link, not per product: a system in «Окна» and «Двери» is
 * prerendered under both. An unreachable backend at build time just means
 * nothing is prerendered — the page renders on demand instead.
 */
export async function productParams(): Promise<{ category: string; product: string }[]> {
  const products = await loadProducts();

  return products.flatMap((product) =>
    product.categories.map((category) => ({
      category: String(category.id),
      product: String(product.id),
    })),
  );
}
