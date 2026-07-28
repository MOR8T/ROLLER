// filepath: /Users/shahrom/Documents/Developer/Order/Praviz/frontend/components/sections/partners-section.tsx
"use client";

import { Container } from "@/components/ui/container";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { partners } from "@/data/home";

export function PartnersSection() {
  return (
    <Section className="bg-neutral-50">
      <Container>
        <SectionHeading
          eyebrow="Доверие"
          title="Материалы и технологии от проверенных поставщиков"
          align="center"
        />

        <Reveal preset="stagger" className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {partners.map((partner) => {
            const isInlineSvg =
              typeof partner.logo === "string" && partner.logo.trim().startsWith("<svg");

            return (
              <RevealItem key={partner.name}>
                <div className="group min-h-24 overflow-hidden rounded-3xl border border-brand-black/10 bg-brand-white shadow-sm transition-all duration-300 hover:border-brand-red/30 hover:shadow-md">
                  {isInlineSvg ? (
                    <div
                      className="flex min-h-24 items-center justify-center p-3 [&_svg]:h-14 [&_svg]:w-full [&_svg]:max-w-[180px]"
                      aria-label={partner.name}
                      role="img"
                      dangerouslySetInnerHTML={{ __html: partner.logo || '' }}
                    />
                  ) : (
                    <div className="flex min-h-24 w-full items-center justify-center px-4 text-center">
                      <span className="font-heading text-sm font-semibold text-brand-black/72 transition-colors duration-300 group-hover:text-brand-red">
                        {partner.name}
                      </span>
                    </div>
                  )}
                </div>
              </RevealItem>
            );
          })}
        </Reveal>
      </Container>
    </Section>
  );
}