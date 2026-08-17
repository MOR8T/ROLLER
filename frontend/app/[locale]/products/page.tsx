import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ProductBrowser } from "@/components/products/product-browser";
import { CategoryCard } from "@/components/products/category-card";
import { PageHeader } from "@/components/layout/page-header";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { categories } from "@/data/products";

/** The "Подобрать" CTA on every card scrolls to the form at the foot of the page. */
/** The "Подобрать" CTA on every card opens the calculator (plan §06). */
const CALCULATOR_HREF = "/calculator";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * The catalog landing — `project_plan/04-catalog-and-applications.md`.
 *
 * One axis, since the client removed the material split on 2026-08-17: the
 * category cards are the "what am I actually buying" entry and lead to the
 * landings, and below them sits the full grid of systems, filterable by
 * category and segment.
 *
 * ⚠️ It opened on *two* axes before that — a pair of full-bleed «ПВХ /
 * Алюминий» tiles above the category cards. Nothing replaced them: the tiles
 * asked a manufacturer's question, and a page that asks it twice, once by
 * material and once by purpose, is the split the client asked to remove.
 *
 * No prices anywhere, on any card — the site does not show them (brief §5.3).
 * Every card's second action is the lead form instead.
 */
export default async function CatalogPage({ params }: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "catalog" });
  const tCategories = await getTranslations({ locale, namespace: "categories" });

  return (
    <>
      <Section>
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
      </Section>

      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={tCategories("eyebrow")}
              title={tCategories("title")}
              description={tCategories("description")}
            />
          </Reveal>

          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {categories.map((category) => (
              <RevealItem key={category.slug} className="h-full">
                <CategoryCard category={category} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section id="systems">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={t("systems.eyebrow")}
              title={t("systems.title")}
              description={t("systems.description")}
            />
          </Reveal>

          <div className="mt-10">
            <ProductBrowser chooseHref={CALCULATOR_HREF} />
          </div>
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}
