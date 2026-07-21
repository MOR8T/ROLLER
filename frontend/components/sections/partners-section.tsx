"use client";

import { useState } from "react";
import { Container } from "@/components/ui/container";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { MediaFrame } from "@/components/ui/media-frame";
import { partners } from "@/data/home";

export function PartnersSection() {
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());

  const handleLogoError = (partnerName: string) => {
    setFailedLogos((prev) => new Set([...prev, partnerName]));
  };

  return (
    <Section className="bg-neutral-50">
      <Container>
        <SectionHeading
          eyebrow="Доверие"
          title="Материалы и технологии от проверенных поставщиков"
          description="Партнёрские логотипы от ведущих производителей комплектующих и технологий."
          align="center"
        />

        <Reveal preset="stagger" className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {partners.map((partner) => {
            const hasLogoAsset = partner.logo !== null;
            const logoLoadFailed = failedLogos.has(partner.name);
            const showLogo = hasLogoAsset && !logoLoadFailed;

            return (
              <RevealItem key={partner.name}>
                <div className="group min-h-24 overflow-hidden rounded-3xl border border-brand-black/10 bg-brand-white shadow-sm transition-all duration-300 hover:border-brand-red/30 hover:shadow-md">
                  {showLogo ? (
                    <div className="relative h-full w-full p-3">
                      <MediaFrame
                        src={partner.logo}
                        alt={`${partner.name} logo`}
                        width={240}
                        height={96}
                        objectFit="contain"
                        className="grayscale transition-all duration-300 group-hover:grayscale-0"
                        containerClassName="h-full w-full border-0"
                        onError={() => handleLogoError(partner.name)}
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center">
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
