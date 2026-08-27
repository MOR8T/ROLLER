import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Quote } from "lucide-react";

import { Breadcrumbs } from "@/components/products/breadcrumbs";
import { PageHeader } from "@/components/layout/page-header";
import { CertificatesGallery } from "@/components/sections/certificates-gallery";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { getAboutCertificates, getAboutContent, getAboutTimeline } from "@/lib/about";
import { PartnersSection } from "@/components/sections/partners-section";

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
 * Backed by the admin panel (`app/admin/(dashboard)/about/page.tsx`) since
 * 2026-08-27, the same way partners already were — `lib/about.ts` reads the
 * hero/story/timeline-heading/certificates-heading/clients-quote text and
 * the 4 stat numbers from the singleton `about_content` row, and the
 * timeline/certificates lists from their own tables. `content`/`milestones`/
 * `certificates` fall back to `null`/`[]` — never fabricated copy — if the
 * backend is unreachable; each section below shows its own skeleton in that
 * case rather than fabricating copy or vanishing, same rule `PartnersSection`
 * already follows for its own strip.
 *
 * `breadcrumb`/`metaTitle`/`metaDescription` stay in `messages/*.json` —
 * static nav-level copy, not something an admin would routinely change.
 */
export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });
  const tProduction = await getTranslations({ locale, namespace: "production" });

  const [content, milestones, certificates] = await Promise.all([
    getAboutContent(locale),
    getAboutTimeline(locale),
    getAboutCertificates(locale),
  ]);

  return (
    <>
      <Section className="pt-12!">
        {content ? (
          <PageHeader
            breadcrumbs={[{ label: t("breadcrumb") }]}
            title={content.heroTitle}
            description={content.heroDescription}
          />
        ) : (
          <Container>
            <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
            <HeroTextSkeleton />
          </Container>
        )}

        <Container>
          {content ? (
            <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {content.stats.map((stat) => (
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
          ) : (
            <StatsSkeleton />
          )}
        </Container>
      </Section>

      <Section>
        <Container>
          {content ? (
            <Reveal className="max-w-3xl">
              <SectionHeading title={content.storyTitle} />
              <div className="mt-6 space-y-4 text-base leading-7 text-brand-black/70">
                {content.storyParagraphs.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Reveal>
          ) : (
            <StorySkeleton />
          )}
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          {milestones.length > 0 ? (
            <>
              <Reveal>
                <SectionHeading
                  title={content?.timelineTitle ?? ""}
                  description={content?.timelineDescription}
                />
              </Reveal>

              <RevealGroup className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                {milestones.map((milestone) => (
                  <RevealItem key={milestone.id} className="h-full">
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
            </>
          ) : (
            <TimelineSkeleton />
          )}
        </Container>
      </Section>

      <Section tone="muted" className="!py-0">
        <PartnersSection />
      </Section>

      <Section>
        <Container>
          {certificates.length > 0 ? (
            <>
              <Reveal>
                <SectionHeading
                  title={content?.certificatesTitle ?? ""}
                  description={content?.certificatesDescription}
                />
              </Reveal>

              <CertificatesGallery
                certificates={certificates}
                label={content?.certificatesTitle ?? ""}
              />
            </>
          ) : (
            <CertificatesSkeleton />
          )}
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          {content ? (
            <Reveal className="mx-auto max-w-2xl text-center">
              <Quote className="mx-auto size-8 text-brand-red" aria-hidden />
              <p className="mt-4 font-heading text-sm font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
                {content.clientsTitle}
              </p>
              <p className="mt-4 text-lg leading-8 text-brand-black/75">{content.clientsQuote}</p>
            </Reveal>
          ) : (
            <ClientsQuoteSkeleton />
          )}
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}

/**
 * Every skeleton below stands in for its section while the backend has
 * nothing yet (`content === null`, or an empty list) — same frame as the
 * real content, same treatment as `HeroSection`'s/`PartnersSection`'s own
 * skeletons: pulses as one unit rather than per-piece, slower and lighter
 * than Tailwind's default `animate-pulse` so it doesn't flash. None of them
 * fabricate copy; they just say "still loading" where the real text would go.
 */
const pulse = { animationDuration: "3.2s" };

function HeroTextSkeleton() {
  return (
    <div className="mt-8 mb-8 max-w-3xl animate-pulse" style={pulse}>
      <div className="h-9 w-3/4 rounded-control bg-brand-black/10 sm:h-10 lg:h-12" />
      <div className="mt-3 h-9 w-1/2 rounded-control bg-brand-black/10 sm:h-10 lg:h-12" />
      <div className="mt-5 h-4 w-full rounded-control bg-brand-black/10" />
      <div className="mt-2 h-4 w-2/3 rounded-control bg-brand-black/10" />
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div
      className="mt-12 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
      style={pulse}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="rounded-card border border-brand-black/10 bg-surface p-5">
          <div className="h-8 w-16 rounded-control bg-brand-black/10" />
          <div className="mt-3 h-3 w-24 rounded-control bg-brand-black/10" />
        </div>
      ))}
    </div>
  );
}

function StorySkeleton() {
  return (
    <div className="max-w-3xl animate-pulse" style={pulse}>
      <div className="h-8 w-2/3 rounded-control bg-brand-black/10 sm:h-9" />
      <div className="mt-6 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-4 w-full rounded-control bg-brand-black/10" />
            <div className="h-4 w-full rounded-control bg-brand-black/10" />
            <div className="h-4 w-2/3 rounded-control bg-brand-black/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="animate-pulse" style={pulse}>
      <div className="h-7 w-56 rounded-control bg-brand-black/10 sm:h-8" />
      <div className="mt-4 h-4 w-3/4 max-w-3xl rounded-control bg-brand-black/10" />

      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-card border border-brand-black/10 bg-surface p-6">
            <div className="h-3 w-12 rounded-control bg-brand-black/10" />
            <div className="mt-3 h-5 w-3/4 rounded-control bg-brand-black/10" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded-control bg-brand-black/10" />
              <div className="h-3 w-2/3 rounded-control bg-brand-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CertificatesSkeleton() {
  return (
    <div className="animate-pulse" style={pulse}>
      <div className="h-7 w-48 rounded-control bg-brand-black/10 sm:h-8" />
      <div className="mt-4 h-4 w-3/4 max-w-3xl rounded-control bg-brand-black/10" />

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-3/4 rounded-card border border-brand-black/10 bg-brand-black/10"
          />
        ))}
      </div>
    </div>
  );
}

function ClientsQuoteSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse text-center" style={pulse}>
      <div className="mx-auto size-8 rounded-control bg-brand-black/10" />
      <div className="mx-auto mt-4 h-3 w-32 rounded-control bg-brand-black/10" />
      <div className="mx-auto mt-4 space-y-2">
        <div className="h-5 w-full rounded-control bg-brand-black/10" />
        <div className="h-5 w-full rounded-control bg-brand-black/10" />
        <div className="mx-auto h-5 w-2/3 rounded-control bg-brand-black/10" />
      </div>
    </div>
  );
}
