import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Factory, MapPin, ShieldCheck, Wrench } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { PartnersGrid } from "@/components/sections/partners-grid";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { companyStats } from "@/data/home";

const capabilityIcons = {
  production: Factory,
  installation: Wrench,
  showroom: MapPin,
  warranty: ShieldCheck,
} as const;

type CapabilityKey = keyof typeof capabilityIcons;

const capabilityKeys = Object.keys(capabilityIcons) as CapabilityKey[];

interface Milestone {
  year: string;
  title: string;
  description: string;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * `/about` — `project_plan/07-secondary-pages.md`.
 *
 * The facts are the client's own (brief §7): founded 2006, 20 years, the 2025
 * step to ООО «Алюмини Аввалин» and aluminium systems, 400 people, 10 000 t a
 * year, 1000+ objects, own workshop, fitting crews, a showroom. Nothing here is
 * invented — the one block that could not be written without the client is the
 * warranty, and that text is theirs verbatim (§7.5), which is why it is set as
 * a list of terms rather than paraphrased into marketing copy.
 */
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });
  const tProduction = await getTranslations({ locale, namespace: "production" });

  const milestones = t.raw("timeline.items") as Milestone[];
  const warrantyTerms = t.raw("warranty.terms") as string[];

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
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
            {companyStats.map((stat) => (
              <RevealItem key={stat.key}>
                <div className="h-full rounded-card border border-brand-black/10 bg-surface p-5">
                  <p className="font-heading text-3xl font-bold text-brand-black tabular-nums">
                    {stat.value.toLocaleString(locale)}
                    {stat.suffix}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-brand-black/60">
                    {tProduction(`stats.${stat.key}`)}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={t("timeline.eyebrow")}
              title={t("timeline.title")}
              description={t("timeline.description")}
            />
          </Reveal>

          <RevealGroup className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {milestones.map((milestone) => (
              <RevealItem key={milestone.year} className="h-full">
                <article className="flex h-full flex-col rounded-card border border-brand-black/10 bg-surface p-6">
                  <p className="font-heading text-sm font-bold tracking-[0.2em] text-brand-red">
                    {milestone.year}
                  </p>
                  <h3 className="mt-3 font-heading text-lg font-bold text-brand-black">
                    {milestone.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-brand-black/65">
                    {milestone.description}
                  </p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={t("capabilities.eyebrow")}
              title={t("capabilities.title")}
              description={t("capabilities.description")}
            />
          </Reveal>

          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:gap-5">
            {capabilityKeys.map((key) => {
              const Icon = capabilityIcons[key];

              return (
                <RevealItem key={key} className="h-full">
                  <article className="flex h-full gap-4 rounded-card border border-brand-black/10 bg-surface p-6">
                    <span className="rounded-control bg-brand-red/10 p-3 text-brand-red">
                      <Icon className="size-6 shrink-0" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-brand-black">
                        {t(`capabilities.items.${key}.title`)}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-brand-black/65">
                        {t(`capabilities.items.${key}.description`)}
                      </p>
                    </div>
                  </article>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={t("partners.eyebrow")}
              title={t("partners.title")}
              description={t("partners.description")}
            />
          </Reveal>

          <PartnersGrid className="mt-10" />
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal className="max-w-3xl">
            <SectionHeading eyebrow={t("warranty.eyebrow")} title={t("warranty.title")} />
            <p className="mt-6 text-base leading-7 text-brand-black/65">{t("warranty.intro")}</p>

            <ul className="mt-8 space-y-3">
              {warrantyTerms.map((term) => (
                <li
                  key={term}
                  className="flex gap-3 rounded-card border border-brand-black/10 bg-surface p-4 text-sm leading-6 text-brand-black/75"
                >
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-red" aria-hidden />
                  {term}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm leading-6 text-brand-black/55">{t("warranty.note")}</p>
          </Reveal>
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}
