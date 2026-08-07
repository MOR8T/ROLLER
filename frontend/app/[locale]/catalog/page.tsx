import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ApplicationCard } from "@/components/catalog/application-card";
import { CatalogBrowser } from "@/components/catalog/catalog-browser";
import { CategoryCard } from "@/components/catalog/category-card";
import { PageHeader } from "@/components/layout/page-header";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { applications, categories } from "@/data/catalog";

/** The "Подобрать" CTA on every card scrolls to the form at the foot of the page. */
/** The "Подобрать" CTA on every card opens the calculator (plan §06). */
const CALCULATOR_HREF = "/calculator";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalog">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * The catalog landing — `project_plan/04-catalog-and-applications.md`.
 *
 * It opens on both axes at once because they answer different questions. The
 * two category tiles are the material split, which is the product's home and
 * its URL. The application cards are the "what am I actually buying" entry and
 * lead to the SEO landings. Below them the full grid of systems, filterable by
 * material, segment and application.
 *
 * No prices anywhere, on any card — the site does not show them (brief §5.3).
 * Every card's second action is the lead form instead.
 */
export default async function CatalogPage({ params }: PageProps<"/[locale]/catalog">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "catalog" });
  const tApplications = await getTranslations({ locale, namespace: "applications" });

  return (
    <>
      <Section>
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <Container>
          <RevealGroup className="mt-12 grid gap-5 sm:gap-6 lg:grid-cols-2">
            {categories.map((category) => (
              <RevealItem key={category.slug}>
                <CategoryCard category={category} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={tApplications("eyebrow")}
              title={tApplications("title")}
              description={tApplications("description")}
            />
          </Reveal>

          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {applications.map((application) => (
              <RevealItem key={application.slug} className="h-full">
                <ApplicationCard application={application} />
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
            <CatalogBrowser chooseHref={CALCULATOR_HREF} />
          </div>
        </Container>
      </Section>

      <LeadFormSection />
    </>
  );
}
