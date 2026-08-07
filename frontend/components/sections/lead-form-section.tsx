import { useTranslations } from "next-intl";
import { Clock, Ruler, ShieldCheck } from "lucide-react";

import { RequestForm } from "@/components/forms/request-form";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { leadScenarios } from "@/lib/leads";

const trustPoints = [
  { key: "measure", icon: Ruler },
  { key: "response", icon: Clock },
  { key: "warranty", icon: ShieldCheck },
] as const;

/**
 * The request section that closes the homepage and every catalog page.
 *
 * Since stage 06 the form itself is `RequestForm` — one component, three
 * scenarios, one submit order (store, then WhatsApp). This section owns only
 * the copy around it, which is why it is a server component again.
 *
 * The section used to be flooded with `bg-brand-red`. DESIGN.md §3 п.3 caps red
 * at roughly 5% of the screen and bans full-width red fills outright — red
 * reads as more urgent here precisely because it is only the button.
 */
export function LeadFormSection() {
  const t = useTranslations("leadForm");

  return (
    <Section id="lead-form">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        <Reveal>
          <p className="font-heading text-sm font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
            {t("title")}
          </h2>
          <ul className="mt-8 space-y-3">
            {trustPoints.map((point) => (
              <li key={point.key} className="flex items-center gap-3">
                <span className="rounded-control bg-brand-red/10 p-2 text-brand-red">
                  <point.icon className="size-5 shrink-0" />
                </span>
                <span className="text-sm font-medium text-brand-black/75">
                  {t(`trustPoints.${point.key}`)}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <RequestForm scenarios={leadScenarios} />
        </Reveal>
      </Container>
    </Section>
  );
}
