import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { Container } from "@/components/ui/container";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { projects } from "@/data/portfolio";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/products">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PortfolioPage({ params }: PageProps<"/[locale]/products">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "portfolio" });

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
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {projects.map((project) => (
              <RevealItem key={project.slug} className="h-full">
                <ProjectCard project={project} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}
