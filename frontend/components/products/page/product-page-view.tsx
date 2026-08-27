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
import type { ProductPageData } from "@/types/product-page";

/**
 * The product page, client side: one state holding the whole page, and seven
 * sections reading slices of it.
 *
 * ── Why state and not props ────────────────────────────────────────────────
 *
 * Nothing here mutates `data` today, and a `const` object would render the same
 * pixels. It is state because the client asked for the page to be driven by one
 * — this is the seam the admin panel and the API arrive through in stage 11: a
 * fetch, a `setData`, and every section below re-renders from the same object
 * without a single one of them learning where the data came from.
 *
 * ── Why it re-seeds ────────────────────────────────────────────────────────
 *
 * `useState` keeps the *first* value it is given. A client-side navigation from
 * one system to another re-renders this component with new props while React
 * keeps the instance alive, so the initial value has to be re-adopted when the
 * address changes — the "adjust state on prop change" pattern, and the reason
 * the comparison is on `product`/`category` rather than object identity.
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

  if (data.product !== initialData.product || data.category !== initialData.category) {
    setData(initialData);
    return null;
  }

  if (data.status === "not-found") {
    return <ProductNotFoundSection data={data.notFound} locale={locale} />;
  }

  const { hero, finishes, specs, story, gallery, promo } = data.sections;

  return (
    <>
      <ProductHeroSection data={hero} locale={locale} />
      <ProductFinishesSection data={finishes} locale={locale} />
      <ProductSpecsSection data={specs} locale={locale} />
      <ProductStorySection data={story} locale={locale} />
      <ProductGallerySection data={gallery} locale={locale} />
      <ProductPromoSection data={promo} locale={locale} />

      {/* The site's one request block, given this page's words and told
          which system the visitor was reading — built server-side by the
          page and passed down, see the `contactsSection` prop comment. */}
      {contactsSection}
    </>
  );
}
