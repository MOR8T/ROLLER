import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ApplicationCard } from "@/components/catalog/application-card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState, ProductGrid } from "@/components/catalog/product-grid";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { applications, isApplicationSlug, productsByApplication } from "@/data/catalog";

const LEAD_FORM_ANCHOR = "#lead-form";
const CALCULATOR_HREF = "/calculator";

export function generateStaticParams() {
  return applications.map((application) => ({ application: application.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/solutions/[application]">): Promise<Metadata> {
  const { locale, application } = await params;
  if (!isApplicationSlug(application)) return {};

  const t = await getTranslations({ locale, namespace: "applications" });

  return {
    title: t(`items.${application}.metaTitle`),
    description: t(`items.${application}.metaDescription`),
  };
}

/**
 * An application landing — the page that answers a search query.
 *
 * The brief's targets (§14.2) are phrased by product and by city — "пластиковые
 * окна Душанбе", "алюминиевые двери Душанбе", "фасадное остекление" — and none
 * of them maps onto a material category, because every system serves several of
 * them. So the `<h1>` here carries the query and the body lists whichever
 * systems are linked to this application, drawn from the many-to-many field
 * rather than from a category.
 *
 * No FAQ block. The plan asks for one "при наличии контента" and there is none
 * in the brief; inventing answers about warranty terms or lead times on the
 * client's behalf is worse than the missing section.
 */
export default async function ApplicationPage({
  params,
}: PageProps<"/[locale]/solutions/[application]">) {
  const { locale, application } = await params;
  if (!isApplicationSlug(application)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "applications" });
  const tCatalog = await getTranslations({ locale, namespace: "catalog" });
  const tSolutions = await getTranslations({ locale, namespace: "solutions" });

  const title = t(`items.${application}.title`);
  const items = productsByApplication(application);
  const others = applications.filter((item) => item.slug !== application);
  const image = applications.find((item) => item.slug === application)?.image ?? null;

  return (
    <>
      <Section>
        <PageHeader
          breadcrumbs={[{ label: tCatalog("breadcrumb"), href: "/catalog" }, { label: title }]}
          eyebrow={t("eyebrow")}
          title={t(`items.${application}.heading`)}
          description={t(`items.${application}.intro`)}
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
                <ApplicationCard application={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <LeadFormSection />
    </>
  );
}
