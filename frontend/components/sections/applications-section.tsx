import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { applications, type ApplicationBase } from "@/data/home";

/**
 * Entry points by situation rather than by material (DESIGN.md §7).
 *
 * The old homepage asked visitors to choose "PVC or aluminium" first. A flat
 * owner cannot answer that — it is a manufacturer's question. "Where are the
 * windows going?" is one they can answer.
 *
 * Targets are the SEO landings built in stage 04.
 */
function ApplicationCard({ application }: { application: ApplicationBase }) {
  const t = useTranslations("applications");
  const title = t(`items.${application.slug}.title`);

  return (
    <Link
      href={application.href}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <MediaFrame
        src={application.image}
        alt={title}
        // The title is interpolated as written. It used to be lowercased in
        // code, which is unsafe once Turkish is in scope: `toLowerCase()` turns
        // "İ" into "i̇" and "I" into "i" rather than "ı".
        placeholderLabel={t("imagePlaceholder", { title })}
        width={420}
        height={300}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        containerClassName="rounded-none border-0"
      />

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-xl font-semibold text-brand-black">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/70">
          {t(`items.${application.slug}.description`)}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
          {t("cta")}
          <ArrowUpRight className="size-4 shrink-0" />
        </span>
      </div>
    </Link>
  );
}

export function ApplicationsSection() {
  const t = useTranslations("applications");

  return (
    <Section id="applications">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {applications.map((application) => (
            <RevealItem key={application.slug} className="h-full">
              <ApplicationCard application={application} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
