import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { ProductPageView } from "@/components/products/page/product-page-view";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { getProductMeta, getProductPage, productParams } from "@/lib/products";

/**
 * `/[locale]/products/[category]/[product]` — the product page.
 *
 * ── What this file is ──────────────────────────────────────────────────────
 *
 * A thin server shell. `lib/products.ts` reads the backend and returns the
 * whole page as one `ProductPageData`; `ProductPageView` holds it in state and
 * hands each block its slice, so no section knows about routes, the API or the
 * message catalogue.
 *
 * The server half stays a server component on purpose: `generateStaticParams`,
 * `generateMetadata` and the prerender are worth more than the symmetry of
 * marking the file `"use client"`.
 *
 * ── The two id segments ────────────────────────────────────────────────────
 *
 * Both are database ids, not slugs — the client's call when the catalogue moved
 * to the admin panel: a product's name is edited freely in four languages and
 * nothing in the admin form asks for a Latin URL segment.
 *
 * The category segment is *not* validated against the product. A system is
 * listed in several categories and `/products/1/2` and `/products/2/2` are both
 * real, exactly as when the segment was a slug — it says which list the visitor
 * followed, not what the product is. Only an unknown *product* turns the page
 * into the «Продукт не найден» section, and it does not call `notFound()`.
 */
export async function generateStaticParams() {
  return productParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[category]/[product]">): Promise<Metadata> {
  const { locale, product } = await params;
  const meta = await getProductMeta(locale, Number(product));

  if (!meta) {
    const t = await getTranslations({ locale, namespace: "productPage" });
    return { title: t("notFound.title") };
  }

  return { title: meta.title, description: meta.description };
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/products/[category]/[product]">) {
  const { locale, category, product } = await params;
  setRequestLocale(locale);

  // `Number("roller")` is `NaN`, which the API would 422 on — a stale link from
  // the slug era becomes the «не найден» section rather than an error page.
  const pageData = await getProductPage(Number(category), Number(product));

  const contactsSection =
    pageData.status === "found" ? (
      <ContactsLeadSection
        id={pageData.contacts.id}
        title={localized(pageData.contacts.title, locale as Locale)}
        description={localized(pageData.contacts.description, locale as Locale)}
        context={localized(pageData.contacts.context, locale as Locale)}
      />
    ) : null;

  return <ProductPageView initialData={pageData} contactsSection={contactsSection} />;
}
