import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ProductGrid } from "@/components/catalog/product-grid";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { categories, isCategorySlug, productsByCategory } from "@/data/catalog";

const CALCULATOR_HREF = "/calculator";

/**
 * ⚠️ Slugs are `pvc` and `aluminium`. An earlier draft of the plan wrote `pvh`;
 * `project_plan/04-catalog-and-applications.md` settles it in favour of the
 * code, and `isCategorySlug` is what keeps a stray `/catalog/pvh` a 404 rather
 * than an empty page.
 *
 * Only the locale is returned here — Next combines it with the parent segment's
 * params, and the two category slugs are enumerated below it.
 */
export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalog/[category]">): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isCategorySlug(category)) return {};

  const t = await getTranslations({ locale, namespace: "categories" });

  return {
    title: t(`items.${category}.metaTitle`),
    description: t(`items.${category}.metaDescription`),
  };
}

/**
 * A category page: one material, the systems that are made from it.
 *
 * This is the product's home in the URL tree, so the trail here is
 * `Главная → Каталог → ПВХ`, and every system below links on to
 * `/catalog/[category]/[product]`.
 */
export default async function CategoryPage({ params }: PageProps<"/[locale]/catalog/[category]">) {
  const { locale, category } = await params;
  if (!isCategorySlug(category)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "categories" });
  const tCatalog = await getTranslations({ locale, namespace: "catalog" });

  const items = productsByCategory(category);

  return (
    <>
      <Section>
        <PageHeader
          breadcrumbs={[
            { label: tCatalog("breadcrumb"), href: "/catalog" },
            { label: t(`items.${category}.title`) },
          ]}
          eyebrow={t(`items.${category}.eyebrow`)}
          title={t(`items.${category}.heading`)}
          description={t(`items.${category}.intro`)}
        />

        <Container>
          <ProductGrid
            className="mt-12"
            products={items}
            chooseHref={CALCULATOR_HREF}
            empty={
              <EmptyState
                title={tCatalog("empty.title")}
                description={tCatalog("categoryEmptyDescription")}
                action={
                  <ButtonLink href="/catalog" variant="outline">
                    {tCatalog("breadcrumb")}
                  </ButtonLink>
                }
              />
            }
          />
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}
