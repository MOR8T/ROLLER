import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { heroContent } from "@/data/home";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";

/**
 * Homepage first screen.
 *
 * Deliberately not a carousel. DESIGN.md §2 rules out the IMZO-style promo
 * carousel, and §7 describes the hero in the singular: one brand promise, one
 * primary action, one secondary action. Dropping it also takes Swiper and
 * framer-motion off the homepage's critical path and lets this render on the
 * server.
 *
 * The image is the "context" layer — an interior, facade or finished object.
 * A profile cutaway here is the one thing §11 explicitly forbids: a visitor
 * reads it as "a profile factory", not as "warmth and comfort for my home",
 * which is precisely the reaction the client reported.
 */
export function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section id="hero" aria-label={t("aria")} className="border-b border-brand-black/8 bg-surface">
      {/* Two columns from `md`, not `lg`: the image may only appear where it can
          sit beside the headline. Stacked underneath it pushes the hero past
          the 72–80svh cap in DESIGN.md §5. */}
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

          {/* Side by side only from `lg`. In the narrower md column the labels
              wrapped mid-button, and Tajik runs 10–20% longer than Russian
              (DESIGN.md §10) — stacking is the layout that survives both. */}
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

        {/* Hidden on phones: below `md` there is no second column to put it in,
            and at 360px there is no height left for both the promise and the
            image. The promise wins. */}
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
