import { useTranslations } from "next-intl";

import { ApplicationCard } from "@/components/catalog/application-card";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { applications } from "@/data/catalog";

/**
 * Entry by task rather than by material (DESIGN.md §7).
 *
 * The old homepage asked visitors to choose "PVC or aluminium" first. A flat
 * owner cannot answer that — it is a manufacturer's question. "Windows, doors
 * or a facade?" is one they can, and unlike the four *situations* this section
 * shipped with in stage 02 it is also a real facet on a product: every one of
 * these cards is a link the catalog can filter by and a page a search query can
 * land on.
 *
 * The card itself is shared with `/catalog` — same component, same copy.
 */
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

        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
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
