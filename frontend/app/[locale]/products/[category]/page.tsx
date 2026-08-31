import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
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
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <Section>
        <PageHeader
          // «Продукция» is the trail's last stop as well as the eyebrow: the
          // catalogue index it used to link to is gone, and a crumb with no
          // href renders as plain text.
          breadcrumbs={[{ label: page.name }]}
          eyebrow={tNav("products")}
          title={page.name}
          description={t("description")}
        />
      </Section>

      <Section tone="muted">
        <Container>
          {page.products.length === 0 ? (
            <p className="text-base text-brand-black/65">{t("empty")}</p>
          ) : (
            <RevealGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {page.products.map((product) => (
                <RevealItem key={product.id} className="h-full">
                  <ProductCard product={product} categoryId={page.id} />
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
