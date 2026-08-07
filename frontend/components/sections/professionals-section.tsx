import { useTranslations } from "next-intl";
import { accentTag, SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { proOfferingKeys } from "@/data/home";

/**
 * "Профессионалам" — the only dark section on the page.
 *
 * The dark ground is a semantic marker, not decoration (DESIGN.md §3 п.2): it
 * says the audience has changed from a private client to a window manufacturer
 * or dealer. Nothing else on the site may go dark except the footer.
 *
 * This is also the one place where profile cutaways belong — the "technical"
 * imagery layer from §6, addressed to people who read a cross-section the way
 * an architect does.
 */

// `/hero/hero-main.png` is a profile cross-section. It used to headline the
// homepage, which is exactly what §11 forbids; here it is in its proper place.
const TECHNICAL_IMAGE = "/hero/hero-main.png";

export function ProfessionalsSection() {
  const t = useTranslations("professionals");

  return (
    <Section id="professionals" tone="inverse" className="scroll-mt-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow={t("eyebrow")}
              tone="dark"
              title={t.rich("title", { accent: accentTag })}
              description={t("description")}
            />

            {/* Since stage 07 both actions land on `/professionals`, the page
                this section is the teaser for — the plan asks for the link from
                exactly here. WhatsApp stays one tap away on that page's form. */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/professionals" size="lg">
                {t("requestPrice")}
              </ButtonLink>
              <ButtonLink href="/professionals" variant="outline-inverse" size="lg">
                {t("becomeDealer")}
              </ButtonLink>
            </div>
          </Reveal>

          <MediaFrame
            src={TECHNICAL_IMAGE}
            alt={t("imageAlt")}
            width={620}
            height={460}
            objectFit="contain"
            sizes="(max-width: 1024px) 100vw, 45vw"
            containerClassName="border-brand-white/15 bg-brand-white/5"
          />
        </div>

        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {proOfferingKeys.map((key) => (
            <RevealItem
              key={key}
              className="flex h-full flex-col rounded-card border border-brand-white/15 bg-brand-white/5 p-6"
            >
              <h3 className="font-heading text-lg font-semibold text-brand-white">
                {t(`offerings.${key}.title`)}
              </h3>
              <p className="mt-3 text-sm leading-6 text-brand-white/65">
                {t(`offerings.${key}.description`)}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
