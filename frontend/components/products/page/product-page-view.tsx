"use client";

import { useState, type ReactNode } from "react";
import { useLocale } from "next-intl";

import type { Locale } from "@/i18n/routing";
import { ProductFinishesSection } from "./product-finishes-section";
import { ProductGallerySection } from "./product-gallery-section";
import { ProductHeroSection } from "./product-hero-section";
import { ProductNotFoundSection } from "./product-not-found-section";
import { ProductPromoSection } from "./product-promo-section";
import { ProductSpecsSection } from "./product-specs-section";
import { ProductStorySection } from "./product-story-section";
import type { ProductPageBlock, ProductPageData } from "@/types/product-page";

/**
 * The product page, client side: one state holding the whole page, a hero, an
 * admin-ordered list of blocks, and the lead form.
 *
 * ── Why state and not props ────────────────────────────────────────────────
 *
 * Nothing here mutates `data` today, and a `const` object would render the same
 * pixels. It is state because the client asked for the page to be driven by one
 * — a fetch and a `setData` re-render every block below from the same object,
 * and not one of them learns where the data came from.
 *
 * ── Why it re-seeds ────────────────────────────────────────────────────────
 *
 * `useState` keeps the *first* value it is given. A client-side navigation from
 * one system to another re-renders this component with new props while React
 * keeps the instance alive, so the initial value has to be re-adopted when the
 * address changes — the "adjust state on prop change" pattern, and the reason
 * the comparison is on `productId`/`categoryId` rather than object identity.
 *
 * ⚠️ `Object.is`, not `!==`. Both ids are `Number(segment)` and a segment that
 * is not a number gives `NaN` — `/products/abc/def`, a stale link from when the
 * segments were slugs, which the page answers with its «не найден» block.
 * `NaN !== NaN` is `true`, so a plain comparison re-seeds the state on every
 * render and React throws "Too many re-renders" instead of rendering it.
 *
 * ── Why the body is a loop ─────────────────────────────────────────────────
 *
 * It used to be seven hardcoded elements in a fixed order. The order is the
 * admin's now: they add the blocks a product needs, in the order they want
 * them, and may add the same kind twice. `blocks` arrives already sorted from
 * `lib/products.ts` — this component renders it as given and never reorders,
 * groups or deduplicates it.
 */
export function ProductPageView({
  initialData,
  contactsSection,
}: {
  initialData: ProductPageData;
  /**
   * `ContactsLeadSection` is a Server Component (it fetches the
   * admin-managed contact list) and cannot be imported into this client
   * component — its parent, the page's Server Component, builds it and
   * hands it down instead.
   */
  contactsSection: ReactNode;
}) {
  const locale = useLocale() as Locale;
  const [data, setData] = useState<ProductPageData>(initialData);

  if (
    !Object.is(data.productId, initialData.productId) ||
    !Object.is(data.categoryId, initialData.categoryId)
  ) {
    setData(initialData);
    return null;
  }

  if (data.status === "not-found") {
    return <ProductNotFoundSection data={data.notFound} locale={locale} />;
  }

  return (
    <>
      <ProductHeroSection data={data.hero} locale={locale} />

      {data.blocks.map((block) => (
        <ProductBlock key={block.section.id} block={block} locale={locale} />
      ))}

      {/* The site's one calculator pitch — identical on every product and no
          longer admin content, see `ProductPageData.promo`'s doc comment. */}
      <ProductPromoSection data={data.promo} locale={locale} />

      {/* The site's one request block, given this page's words and told
          which system the visitor was reading — built server-side by the
          page and passed down, see the `contactsSection` prop comment. */}
      {contactsSection}
    </>
  );
}

/**
 * One block, dispatched on its kind.
 *
 * The `switch` is exhaustive over `ProductPageBlock`, so adding a sixth section
 * type to the union is a TypeScript error here until this component knows how
 * to draw it — which is the point of tagging the blocks rather than passing
 * `type: string`.
 */
function ProductBlock({ block, locale }: { block: ProductPageBlock; locale: Locale }) {
  switch (block.kind) {
    case "finishes":
      return <ProductFinishesSection data={block.section} locale={locale} />;
    case "specs":
      return <ProductSpecsSection data={block.section} locale={locale} />;
    case "story":
      return <ProductStorySection data={block.section} locale={locale} />;
    case "gallery":
      return <ProductGallerySection data={block.section} locale={locale} />;
  }
}
