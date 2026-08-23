"use client";

import type { Locale } from "@/i18n/routing";
import { ImzoActions, ImzoSection, ImzoSectionHeader } from "./section-kit";
import type { ProductNotFoundSectionData } from "@/types/product-page";

/**
 * What the page shows when the address does not name a system.
 *
 * A section rather than `notFound()`, at the client's instruction: the category
 * segment of the URL is not checked against the product, so
 * `/products/anything/roller` renders the system, and only an unknown *product*
 * — or an unknown category — lands here. The visitor stays on a product page
 * that says what happened and offers the catalog, instead of being thrown to
 * the site's 404.
 */
export function ProductNotFoundSection({
  data,
  locale,
}: {
  data: ProductNotFoundSectionData;
  locale: Locale;
}) {
  return (
    <ImzoSection id={data.id} className="min-h-[60vh] content-center lg:py-24">
      <ImzoSectionHeader section={data} locale={locale} size="display" align="center" />
      <ImzoActions actions={data.actions} locale={locale} className="mt-10 justify-center" />
    </ImzoSection>
  );
}
