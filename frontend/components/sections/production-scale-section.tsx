import { useFormatter, useTranslations } from "next-intl";

import { accentTag, SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { PartnersGrid } from "@/components/sections/partners-grid";
import { companyStats, serviceHighlights } from "@/data/home";

/**
 * "Производство и масштаб" — for developers and dealers (DESIGN.md §7).
 *
 * This one section replaces the four that used to run back to back: About,
 * Advantages, Stats and Partners. Between them they made the same claim
 * ("we do everything ourselves") four times in four different card layouts,
 * which is the duplication stage 02 asks to collapse. What survives is the
 * evidence: the numbers, the production chain, and who supplies the materials.
 *
 * The numbers are rendered statically. The old count-up animation was pleasant
 * but §8 sanctions motion only where it explains the product — a number
 * counting up explains nothing — and dropping it takes framer-motion off this
 * section entirely.
 */
export function ProductionScaleSection() {
  const t = useTranslations("production");
  // Grouping separators are a locale decision, not a formatting detail:
  // "10 000" in Russian, "10,000" in English, "10.000" in Turkish. This used to
  // be a hand-rolled regex, written that way to avoid the hydration mismatch a
  // bare `toLocaleString` risks — `next-intl`'s formatter resolves the same
  // locale on the server and on the client, so the mismatch cannot occur.
  const format = useFormatter();

  return (
    <Section id="production" tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t.rich("title", { accent: accentTag })}
            description={t("description")}
          />
        </Reveal>

        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
          {companyStats.map((stat) => (
            <RevealItem
              key={stat.key}
              className="flex h-full flex-col rounded-card border border-brand-black/10 bg-surface p-6"
            >
              <p className="font-heading text-4xl font-bold tracking-tight text-brand-black tabular-nums">
                {format.number(stat.value)}
                {stat.suffix}
              </p>
              <p className="mt-3 text-sm leading-6 text-brand-black/65">{t(`stats.${stat.key}`)}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12">
          <h3 className="font-heading text-sm font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
            {t("fullCycle")}
          </h3>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {serviceHighlights.map((step, index) => (
              <li
                key={step.key}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 bg-surface p-5"
              >
                <span className="font-heading text-sm font-semibold text-brand-black/35 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <step.icon className="size-5 shrink-0 text-brand-black/45" aria-hidden />
                <span className="font-heading text-base font-semibold text-brand-black">
                  {t(`steps.${step.key}`)}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal className="mt-12">
          <h3 className="font-heading text-sm font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
            {t("suppliers")}
          </h3>
          <PartnersGrid className="mt-5" />
        </Reveal>
      </Container>
    </Section>
  );
}
