import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CategoryEmptyState } from "@/components/products/category-empty-state";
import { CategoryHeroSection } from "@/components/products/category-hero-section";
import { ProductCard } from "@/components/products/product-card";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { Container } from "@/components/ui/container";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { getProductCategoryPage, productCategoryParams } from "@/lib/products";
import { notFound } from "next/navigation";

/**
 * `/[locale]/products/[category]` — one category and the products in it.
 *
 * ⚠️ This replaced `/products`, the catalogue index, which the client removed
 * on 2026-08-28 («нам раздел /products не нужен»). The index carried category
 * cards, a segment/material filter row and a grid of every system; none of that
 * survived — the entry point is the category strip on the homepage, and this
 * page is where it lands.
 *
 * There is no filter row here on purpose. Filtering existed to cut a list of
 * every system down to a category, which is now what the address does.
 *
 * A category with no products yet renders the header and a single line saying
 * so, not a 404: an empty category is the normal state between an admin
 * creating one and filling it. A category *id* that does not exist is a 404.
 *
 * Redesigned 2026-09-02:
 *
 *   the band     `CategoryHeroSection` in place of `PageHeader` — the
 *                category's photograph was fetched into
 *                `ProductCategoryPageDto.image` and never drawn.
 *   the grid     the column count now follows the list's length; see below.
 *   the blank    `CategoryEmptyState` in place of one grey sentence.
 *
 * ⚠️ The same pass also put a strip of category chips under the band, so a
 * visitor could move to a neighbouring category without going back to the
 * homepage. The client removed it the same day: the header's «Продукция» panel
 * already carries every category on every page, and the strip repeated it
 * directly beneath itself.
 */
export async function generateStaticParams() {
  return productCategoryParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products/[category]">): Promise<Metadata> {
  const { locale, category } = await params;
  const page = await getProductCategoryPage(locale, Number(category));
  if (!page) return {};

  const t = await getTranslations({ locale, namespace: "productsCategory" });

  return {
    title: t("metaTitle", { name: page.name }),
    description: t("metaDescription", { name: page.name }),
  };
}

export default async function ProductCategoryPage({
  params,
}: PageProps<"/[locale]/products/[category]">) {
  const { locale, category } = await params;
  setRequestLocale(locale);

  const page = await getProductCategoryPage(locale, Number(category));
  if (!page) notFound();

  const t = await getTranslations({ locale, namespace: "productsCategory" });

  const count = page.products.length;
  const featured = count === 1;

  /**
   * The seeded categories hold 6, 5, 3, 2, 1 and 0 products, and the admin
   * adds to that unevenly — so a fixed `lg:grid-cols-3` left half the
   * catalogue with a torn-off row, and «Перегородки» with one card floating in
   * a third of the width. The count picks the layout instead:
   *
   *   1     one wide card, photo beside the text (`featured`)
   *   2     two halves
   *   3+    the three-column grid
   */
  const columns = count === 2 ? "sm:grid-cols-2" : count > 2 ? "sm:grid-cols-2 lg:grid-cols-3" : "";

  const cardSizes = featured
    ? "(max-width: 1024px) 92vw, 44vw"
    : count === 2
      ? "(max-width: 640px) 92vw, 46vw"
      : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return (
    <>
      <CategoryHeroSection name={page.name} image={page.image} />

      <Section tone="muted">
        <Container>
          {count === 0 ? (
            <CategoryEmptyState
              image={page.image}
              title={t("emptyTitle")}
              line={t("empty")}
              hint={t("emptyHint")}
              calculatorLabel={t("emptyCalculator")}
              contactLabel={t("emptyContact")}
            />
          ) : (
            <RevealGroup className={`grid gap-4 lg:gap-5 ${columns}`}>
              {page.products.map((product) => (
                <RevealItem key={product.id} className="h-full">
                  <ProductCard
                    product={product}
                    categoryId={page.id}
                    featured={featured}
                    sizes={cardSizes}
                  />
                </RevealItem>
              ))}
            </RevealGroup>
          )}
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}
