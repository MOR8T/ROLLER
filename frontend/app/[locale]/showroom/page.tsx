import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MapEmbed } from "@/components/ui/map-embed";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/showroom">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "showroom" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * `/showroom`.
 *
 * ⚠️ Open question №7: this menu item appears in neither the brief nor the
 * plan. It has been in the navigation since stage 01, so leaving it as a 404
 * was not an option — the stage's own acceptance criterion is that no
 * navigation item dangles. The page therefore says only what the brief actually
 * supports: the client has a showroom at the office address, with the office
 * hours. If the client rules the item out, this file and the nav entry go
 * together; if they rule it in, the copy is theirs to expand.
 */
export default async function ShowroomPage({ params }: PageProps<"/[locale]/showroom">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "showroom" });
  const tCommon = await getTranslations({ locale, namespace: "common" });

  const facts = [
    { key: "address", icon: MapPin, value: tCommon("address"), href: siteConfig.mapUrl },
    { key: "hours", icon: Clock, value: tCommon("workingHours") },
    { key: "phone", icon: Phone, value: siteConfig.phone, href: siteConfig.phoneHref },
  ] as const;

  const seeItems = t.raw("see.items") as string[];

  return (
    <>
      <Section>
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        >
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={siteConfig.whatsappHref} size="lg">
              <MessageCircle className="size-5 shrink-0" aria-hidden />
              {tCommon("writeWhatsapp")}
            </ButtonLink>
            <ButtonLink href={siteConfig.phoneHref} variant="outline" size="lg">
              <Phone className="size-5 shrink-0" aria-hidden />
              {tCommon("call")}
            </ButtonLink>
          </div>
        </PageHeader>

        <Container>
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-3 lg:gap-5">
            {facts.map((fact) => {
              const body = (
                <div className="flex h-full flex-col gap-4 rounded-card border border-brand-black/10 bg-surface p-6">
                  <span className="w-fit rounded-control bg-brand-red/10 p-3 text-brand-red">
                    <fact.icon className="size-6 shrink-0" aria-hidden />
                  </span>
                  <div>
                    <p className="font-heading text-xs font-semibold tracking-[0.2em] text-brand-black/50 uppercase">
                      {t(`facts.${fact.key}`)}
                    </p>
                    <p className="mt-2 font-heading text-lg font-semibold text-brand-black">
                      {fact.value}
                    </p>
                  </div>
                </div>
              );

              return (
                <RevealItem key={fact.key} className="h-full">
                  {"href" in fact && fact.href ? (
                    <a
                      href={fact.href}
                      target={fact.href.startsWith("http") ? "_blank" : undefined}
                      rel={fact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="block h-full rounded-card focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {body}
                    </a>
                  ) : (
                    body
                  )}
                </RevealItem>
              );
            })}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
            <Reveal>
              <SectionHeading eyebrow={t("see.eyebrow")} title={t("see.title")} />
              <ul className="mt-8 space-y-3">
                {seeItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-card border border-brand-black/10 bg-surface px-5 py-4 text-sm leading-6 text-brand-black/75"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>

            {/* Square corners: a map is a large media block (DESIGN.md §5). */}
            <Reveal className="h-full">
              <MapEmbed title={t("mapTitle")} className="h-full" />
            </Reveal>
          </div>
        </Container>
      </Section>

      <LeadFormSection />
    </>
  );
}
