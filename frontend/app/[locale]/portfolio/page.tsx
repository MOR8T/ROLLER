import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { ProjectCard } from "@/components/portfolio/project-card";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { Container } from "@/components/ui/container";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { projects } from "@/data/portfolio";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/portfolio">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "portfolio" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * `/portfolio` — `project_plan/07-secondary-pages.md`.
 *
 * ⚠️ The objects are placeholders and the page **must not go to production as
 * it stands**: §10.2 of the brief is empty, so there is no real portfolio to
 * show, and DESIGN.md §6 п.3 bans stock photography here outright. What ships
 * is the layout; the content arrives from the client (open question №3) through
 * the admin panel.
 *
 * The route is `/portfolio`, not the plan's `/projects`: the navigation, the
 * footer and the homepage teasers have all pointed at `/portfolio` since stage
 * 01, and the plan itself settles this class of conflict in favour of the code
 * (the `pvc` / `pvh` precedent in stage 04).
 */
export default async function PortfolioPage({ params }: PageProps<"/[locale]/portfolio">) {
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

      <LeadFormSection />
    </>
  );
}
