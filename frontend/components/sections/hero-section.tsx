import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { heroContent } from "@/data/home";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";

export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section id="hero" aria-label={t("aria")} className="border-b border-brand-black/8 bg-surface">
      <Container className="grid min-h-hero content-center gap-10 py-section md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-12 lg:gap-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.22em] text-brand-black/55 uppercase sm:text-sm">
            {t("eyebrow")}
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance text-brand-black sm:text-4xl lg:text-6xl">
            {t("headline")}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-brand-black/70 lg:text-lg lg:leading-8">
            {t("subtext")}
          </p>

          <div className="mt-8 flex flex-col gap-3 lg:flex-row">
            <ButtonLink href={heroContent.primaryCtaHref} size="lg">
              {t("primaryCta")}
              <ArrowRight className="size-5 shrink-0" />
            </ButtonLink>
            <ButtonLink href={heroContent.secondaryCtaHref} variant="outline" size="lg">
              {t("secondaryCta")}
            </ButtonLink>
          </div>
        </div>
        <MediaFrame
          src={heroContent.image}
          alt={t("imageLabel")}
          placeholderLabel={t("imageLabel")}
          width={640}
          height={500}
          priority
          sizes="(max-width: 1024px) 50vw, 45vw"
          containerClassName="hidden md:block"
        />
      </Container>
    </section>
  );
}
