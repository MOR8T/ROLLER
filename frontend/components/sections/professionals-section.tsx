import { SectionHeading } from "@/components/sections/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { proOfferings } from "@/data/home";
import { siteConfig } from "@/lib/site-config";

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
  return (
    <Section id="professionals" tone="inverse" className="scroll-mt-20">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
          <Reveal>
            <SectionHeading
              eyebrow="Профессионалам"
              tone="dark"
              title={
                <>
                  Профиль <span className="text-brand-red">оптом</span> и условия дилерства
                </>
              }
              description="Работаем с производителями окон, дилерами и проектировщиками: отгрузка профиля, комплектующие со склада и техническая документация по системам."
            />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={siteConfig.whatsappHref} size="lg">
                Запросить прайс
              </ButtonLink>
              <ButtonLink href="/contacts" variant="outline-inverse" size="lg">
                Стать дилером
              </ButtonLink>
            </div>
          </Reveal>

          <MediaFrame
            src={TECHNICAL_IMAGE}
            alt="Разрез профильной системы ROLLER"
            width={620}
            height={460}
            objectFit="contain"
            sizes="(max-width: 1024px) 100vw, 45vw"
            containerClassName="border-brand-white/15 bg-brand-white/5"
          />
        </div>

        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {proOfferings.map((offering) => (
            <RevealItem
              key={offering.title}
              className="flex h-full flex-col rounded-card border border-brand-white/15 bg-brand-white/5 p-6"
            >
              <h3 className="font-heading text-lg font-semibold text-brand-white">
                {offering.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-brand-white/65">{offering.description}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
