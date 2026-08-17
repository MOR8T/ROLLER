import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CategoryCard } from "@/components/catalog/category-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ProductGrid } from "@/components/catalog/product-grid";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { categories, isCategorySlug, productsByCategory } from "@/data/catalog";

const LEAD_FORM_ANCHOR = "#lead-form";
const CALCULATOR_HREF = "/calculator";

export function generateStaticParams() {
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/solutions/[category]">): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isCategorySlug(category)) return {};

  const t = await getTranslations({ locale, namespace: "categories" });

  return {
    title: t(`items.${category}.metaTitle`),
    description: t(`items.${category}.metaDescription`),
  };
}

/**
 * A category landing — the page that answers a search query.
 *
 * The brief's targets (§14.2) are phrased by product and by city — "пластиковые
 * окна Душанбе", "алюминиевые двери Душанбе", "фасадное остекление" — and none
 * of them maps onto a material, because every system serves several of them.
 * So the `<h1>` here carries the query and the body lists whichever systems the
 * category claims.
 *
 * ⚠️ The route is still `/solutions/[category]` — it was `[application]` until
 * the two axes became one on 2026-08-17. The folder was renamed, the URLs were
 * not: these are the indexed landings, and `/catalog/[slug]` is a product now,
 * so the category cannot move there anyway.
 *
 * No FAQ block. The plan asks for one "при наличии контента" and there is none
 * in the brief; inventing answers about warranty terms or lead times on the
 * client's behalf is worse than the missing section.
 */
export default async function CategoryPage({
  params,
}: PageProps<"/[locale]/solutions/[category]">) {
  const { locale, category } = await params;
  if (!isCategorySlug(category)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "categories" });
  const tCatalog = await getTranslations({ locale, namespace: "catalog" });
  const tSolutions = await getTranslations({ locale, namespace: "solutions" });

  const title = t(`items.${category}.title`);
  const items = productsByCategory(category);
  const others = categories.filter((item) => item.slug !== category);
  const image = categories.find((item) => item.slug === category)?.image ?? null;

  return (
    <>
      <Section>
        <PageHeader
          breadcrumbs={[{ label: tCatalog("breadcrumb"), href: "/catalog" }, { label: title }]}
          eyebrow={t("eyebrow")}
          title={t(`items.${category}.heading`)}
          description={t(`items.${category}.intro`)}
        >
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={LEAD_FORM_ANCHOR} size="lg">
              {tSolutions("cta")}
            </ButtonLink>
            <ButtonLink href="/catalog" variant="outline" size="lg">
              {tCatalog("breadcrumb")}
            </ButtonLink>
          </div>
        </PageHeader>

        <Container>
          {/* Context layer, DESIGN.md §6: an interior, a facade, a finished
              object — never a profile cutaway. The slot is a nullable data
              field and renders the neutral placeholder until the client's own
              photography arrives through the admin panel. */}
          <div className="mt-12">
            <MediaFrame
              src={image}
              alt={title}
              placeholderLabel={t("imagePlaceholder", { title })}
              width={1440}
              height={560}
              sizes="100vw"
              containerClassName="rounded-card"
            />
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={tSolutions("systems.eyebrow")}
              title={tSolutions("systems.title")}
              description={tSolutions("systems.description")}
            />
          </Reveal>

          <ProductGrid
            className="mt-10"
            products={items}
            chooseHref={CALCULATOR_HREF}
            empty={
              <EmptyState
                title={tSolutions("empty.title")}
                description={tSolutions("empty.description")}
                action={
                  <ButtonLink href={LEAD_FORM_ANCHOR} variant="outline">
                    {tSolutions("cta")}
                  </ButtonLink>
                }
              />
            }
          />
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={tSolutions("other.eyebrow")}
              title={tSolutions("other.title")}
            />
          </Reveal>

          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {others.map((item) => (
              <RevealItem key={item.slug} className="h-full">
                <CategoryCard category={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}
