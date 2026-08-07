import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FileText, Layers, Package, Truck } from "lucide-react";

import { RequestForm } from "@/components/forms/request-form";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { products } from "@/data/catalog";
import { proOfferingKeys } from "@/data/home";

const offeringIcons = {
  wholesale: Truck,
  dealership: Package,
  components: Layers,
  documentation: FileText,
} as const;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/professionals">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "professionalsPage" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * `/professionals` — the page for window makers, dealers and architects.
 *
 * **Dark throughout**, and that is the only reason it is dark: DESIGN.md §3 п.2
 * makes a dark ground the marker that the audience has changed from a private
 * client to a professional. The homepage section of the same name and the
 * footer are the only other dark surfaces on the site.
 *
 * This is also where the profile cutaways belong — the "technical" image layer
 * of §6, which §11 forbids on the first screen of the homepage but which is
 * exactly what an architect came here for.
 */
export default async function ProfessionalsPage({ params }: PageProps<"/[locale]/professionals">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "professionalsPage" });
  const tPro = await getTranslations({ locale, namespace: "professionals" });
  const tBrands = await getTranslations({ locale, namespace: "brands" });

  const componentItems = t.raw("components.items") as string[];
  const documentationItems = t.raw("documentation.items") as string[];

  // Cutaways, taken from the catalog rather than hardcoded: the aluminium
  // systems have none at all, so anything drawing them has to survive an empty
  // list (`data/catalog.ts`).
  const cutaways = products
    .filter((product) => product.sections.length > 0)
    .map((product) => ({
      slug: product.slug,
      name: tBrands(`items.${product.slug}.name`),
      image: product.sections[0],
    }));

  return (
    <>
      <Section tone="inverse">
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
          tone="dark"
        >
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="#professionals-request" size="lg">
              {tPro("becomeDealer")}
            </ButtonLink>
            <ButtonLink href="#professionals-request" variant="outline-inverse" size="lg">
              {tPro("requestPrice")}
            </ButtonLink>
          </div>
        </PageHeader>

        <Container>
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:gap-5">
            {proOfferingKeys.map((key) => {
              const Icon = offeringIcons[key];

              return (
                <RevealItem key={key} className="h-full">
                  <article className="flex h-full gap-4 rounded-card border border-brand-white/15 bg-brand-white/5 p-6">
                    <span className="rounded-control bg-brand-red/15 p-3 text-brand-red">
                      <Icon className="size-6 shrink-0" aria-hidden />
                    </span>
                    <div>
                      <h2 className="font-heading text-lg font-bold text-brand-white">
                        {tPro(`offerings.${key}.title`)}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-brand-white/65">
                        {tPro(`offerings.${key}.description`)}
                      </p>
                    </div>
                  </article>
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="inverse" className="pt-0">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <SectionHeading
                eyebrow={t("components.eyebrow")}
                title={t("components.title")}
                description={t("components.description")}
                tone="dark"
              />
              <ul className="mt-8 space-y-3">
                {componentItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-card border border-brand-white/12 bg-brand-white/5 px-5 py-4 text-sm leading-6 text-brand-white/80"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal>
              <SectionHeading
                eyebrow={t("documentation.eyebrow")}
                title={t("documentation.title")}
                description={t("documentation.description")}
                tone="dark"
              />
              <ul className="mt-8 space-y-3">
                {documentationItems.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-card border border-brand-white/12 bg-brand-white/5 px-5 py-4 text-sm leading-6 text-brand-white/80"
                  >
                    <FileText className="mt-0.5 size-5 shrink-0 text-brand-red" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-6 text-brand-white/55">
                {t("documentation.note")}
              </p>
            </Reveal>
          </div>
        </Container>
      </Section>

      {cutaways.length > 0 ? (
        <Section tone="inverse" className="pt-0">
          <Container>
            <Reveal>
              <SectionHeading
                eyebrow={t("cutaways.eyebrow")}
                title={t("cutaways.title")}
                description={t("cutaways.description")}
                tone="dark"
              />
            </Reveal>

            <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {cutaways.map((cutaway) => (
                <RevealItem key={cutaway.slug} className="h-full">
                  <figure className="flex h-full flex-col overflow-hidden rounded-card border border-brand-white/12 bg-brand-white/5">
                    <MediaFrame
                      src={cutaway.image}
                      alt={t("cutaways.imageAlt", { name: cutaway.name })}
                      width={600}
                      height={600}
                      objectFit="contain"
                      sizes="(max-width: 640px) 100vw, 25vw"
                      containerClassName="rounded-none border-0 bg-brand-white"
                      className="p-4"
                    />
                    <figcaption className="p-4 font-heading text-sm font-semibold text-brand-white">
                      {cutaway.name}
                    </figcaption>
                  </figure>
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>
      ) : null}

      <Section tone="inverse" className="pt-0" id="professionals-request">
        <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
          <Reveal>
            <SectionHeading
              eyebrow={t("request.eyebrow")}
              title={t("request.title")}
              description={t("request.description")}
              tone="dark"
            />
          </Reveal>

          <Reveal>
            <RequestForm scenarios={["dealer", "quote"]} tone="inverse" />
          </Reveal>
        </Container>
      </Section>
    </>
  );
}
