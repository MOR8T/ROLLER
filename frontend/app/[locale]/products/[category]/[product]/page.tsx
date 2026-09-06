import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { ProductPageView } from "@/components/products/page/product-page-view";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { getProductMeta, getProductPage, productHref } from "@/lib/products";
import { buildPageMetadata } from "@/lib/page-metadata";
import { buildProductJsonLd } from "@/lib/json-ld";
import { JsonLd } from "@/components/seo/json-ld";

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
 * The server half stays a server component on purpose: `generateMetadata`, the
 * JSON-LD and reading the backend without shipping `lib/products.ts` to the
 * browser are worth more than the symmetry of marking the file `"use client"`.
 *
 * ⚠️ **No `generateStaticParams`, deliberately.** It used to return
 * `productParams()`, and that is what took every `/products/*` URL down in
 * production on 2026-09-06 — the full story is on
 * `readMaintenancePreviewCookie` in `lib/maintenance-access.ts`. In short: the
 * image is built where the backend does not exist, so the list came back
 * empty, so Next never rendered the route during the build, so it never saw
 * the `cookies()` call that is supposed to mark everything under `app/[locale]`
 * dynamic — and filed the route as static instead. Every request then threw
 * `DYNAMIC_SERVER_USAGE`, with no prerendered HTML to fall back to, and
 * answered a bare 500. Nothing here is prerendered now, which is the state the
 * rest of the public site has been in since that switch was added.
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
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[category]/[product]">): Promise<Metadata> {
  const { locale, category, product } = await params;
  const meta = await getProductMeta(locale, Number(product));

  if (!meta) {
    // A product id that does not exist renders the «не найден» section rather
    // than a 404 (see the note above), so it is a real 200 response and needs
    // to be kept out of the index explicitly — otherwise every stale link from
    // the slug era becomes an indexed empty page.
    const t = await getTranslations({ locale, namespace: "productPage" });
    return { title: t("notFound.title"), robots: { index: false, follow: false } };
  }

  return buildPageMetadata({
    locale,
    path: productHref(Number(category), Number(product)),
    title: meta.title,
    description: meta.description,
    image: meta.image ?? undefined,
  });
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/products/[category]/[product]">) {
  const { locale, category, product } = await params;
  setRequestLocale(locale);

  // `Number("roller")` is `NaN`, which the API would 422 on — a stale link from
  // the slug era becomes the «не найден» section rather than an error page.
  const pageData = await getProductPage(Number(category), Number(product));

  // `Product` markup, and only when the product actually resolved — the
  // «не найден» state is a page about nothing and has no product to describe.
  //
  // ⚠️ No `BreadcrumbList` here, unlike the category and article pages. This
  // page renders no visible trail (`ProductPageView` has none), and breadcrumb
  // markup that a visitor cannot see on the page is the mismatch the note in
  // `lib/json-ld.ts` warns about. Giving the product page a visible trail would
  // be the fix; inventing one in the markup alone is not.
  const meta = await getProductMeta(locale, Number(product));
  const productJsonLd =
    pageData.status === "found" && meta
      ? await buildProductJsonLd({
          locale,
          path: productHref(Number(category), Number(product)),
          name: meta.title,
          description: meta.description,
          image: meta.image ?? undefined,
          category: meta.categories.find((item) => item.id === Number(category))?.name,
        })
      : null;

  const contactsSection =
    pageData.status === "found" ? (
      <ContactsLeadSection
        id={pageData.contacts.id}
        title={localized(pageData.contacts.title, locale as Locale)}
        description={localized(pageData.contacts.description, locale as Locale)}
        context={localized(pageData.contacts.context, locale as Locale)}
      />
    ) : null;

  return (
    <>
      <JsonLd data={productJsonLd} />
      <ProductPageView initialData={pageData} contactsSection={contactsSection} />
    </>
  );
}
