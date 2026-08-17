import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/products/breadcrumbs";
import { ProjectCard } from "@/components/portfolio/project-card";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { productHref, products } from "@/data/products";
import { findProjectBySlug, projectParams, relatedProjects } from "@/data/portfolio";

export function generateStaticParams() {
  return projectParams;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/portfolio/[project]">): Promise<Metadata> {
  const { locale, project: slug } = await params;
  const project = findProjectBySlug(slug);
  if (!project) return {};

  const t = await getTranslations({ locale, namespace: "projects" });

  return {
    title: t(`items.${project.id}.title`),
    description: t(`items.${project.id}.caption`),
  };
}

/**
 * One object: gallery, the four facts from the grid, the systems used and a
 * short write-up.
 *
 * The gallery is a plain grid rather than a lightbox — the plan offers either,
 * and a lightbox would be JavaScript spent on placeholder images. It becomes
 * worth building when real photography arrives.
 */
export default async function ProjectPage({ params }: PageProps<"/[locale]/portfolio/[project]">) {
  const { locale, project: slug } = await params;
  const project = findProjectBySlug(slug);
  if (!project) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "projects" });
  const tPortfolio = await getTranslations({ locale, namespace: "portfolio" });
  const tBrands = await getTranslations({ locale, namespace: "brands" });

  const title = t(`items.${project.id}.title`);
  const body = t.raw(`items.${project.id}.body`) as string[];
  const systems = products.filter((product) => project.systems.includes(product.slug));
  const others = relatedProjects(project);

  const facts = [
    { label: t("facts.installed"), value: t(`items.${project.id}.installed`) },
    { label: t("facts.volume"), value: t(`items.${project.id}.volume`) },
    { label: t("facts.year"), value: String(project.year) },
  ];

  return (
    <>
      <Section>
        <Container>
          <Breadcrumbs
            items={[{ label: tPortfolio("breadcrumb"), href: "/portfolio" }, { label: title }]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
            <Reveal>
              <MediaFrame
                src={project.gallery[0]}
                alt={title}
                width={900}
                height={640}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {project.gallery.length > 1 ? (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  {project.gallery.slice(1).map((image) => (
                    <MediaFrame
                      key={image}
                      src={image}
                      alt={title}
                      width={440}
                      height={330}
                      sizes="(max-width: 1024px) 50vw, 25vw"
                    />
                  ))}
                </div>
              ) : null}
            </Reveal>

            <Reveal>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="black">{t(`categories.${project.category}`)}</Badge>
                <span className="text-sm text-brand-black/55">
                  {t(`items.${project.id}.location`)}
                </span>
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
                {title}
              </h1>

              <p className="mt-5 text-base leading-7 text-brand-black/65">
                {t(`items.${project.id}.caption`)}
              </p>

              <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-brand-black/8 py-6">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs leading-5 text-brand-black/55">{fact.label}</dt>
                    <dd className="mt-1 font-heading text-base font-bold text-brand-black">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 space-y-4 text-base leading-7 text-brand-black/70">
                {body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-8">
                <p className="text-xs font-semibold tracking-[0.16em] text-brand-black/45 uppercase">
                  {t("facts.systems")}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {systems.map((system) => (
                    <ButtonLink key={system.slug} href={productHref(system)} variant="outline">
                      {tBrands(`items.${system.slug}.name`)}
                    </ButtonLink>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </Section>

      {others.length > 0 ? (
        <Section tone="muted">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow={tPortfolio("other.eyebrow")}
                title={tPortfolio("other.title")}
              />
            </Reveal>

            <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {others.map((other) => (
                <RevealItem key={other.slug} className="h-full">
                  <ProjectCard project={other} />
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>
      ) : null}

      <ContactsLeadSection />
    </>
  );
}
