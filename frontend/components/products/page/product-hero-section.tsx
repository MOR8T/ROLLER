"use client";

import Image from "next/image";

import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { ImzoActions } from "./section-kit";
import type { ProductHeroSectionData } from "@/types/product-page";

/**
 * The opening screen, to the reference's measurements: a 700px band, one
 * photograph edge to edge, and a 600px column of type on the left — name,
 * paragraph, button. Nothing else. imzo carries no eyebrow, no badge and no
 * numbers here, and neither does this.
 *
 * The gradient is ours and has to be: the reference shoots its own product
 * against a dark studio backdrop, while the photograph here is a white, brightly
 * lit showroom. Without a wash under it the white type has nothing to sit on.
 */
export function ProductHeroSection({
  data,
  locale,
}: {
  data: ProductHeroSectionData;
  locale: Locale;
}) {
  const image = data.media?.[0];

  return (
    <section id={data.id} className="relative isolate overflow-hidden bg-black">
      {image ? (
        <Image
          src={image.src}
          alt={localized(image.alt, locale)}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : null}

      <div
        aria-hidden
        className="absolute inset-0 bg-black/70 lg:bg-gradient-to-r lg:from-black/90 lg:via-black/70 lg:to-black/25"
      />

      <Container className="relative flex min-h-[26rem] flex-col justify-center py-16 lg:min-h-[43.75rem] lg:py-20">
        <div className="max-w-[37.5rem]">
          <h1 className="font-sans text-[clamp(2rem,3.08vw,2.775rem)] leading-[1.2] font-bold text-white">
            {localized(data.title, locale)}
          </h1>

          <p className="mt-6 text-[clamp(1rem,1.24vw,1.115rem)] leading-[1.4] font-medium text-white">
            {localized(data.description, locale)}
          </p>

          <ImzoActions actions={data.actions} locale={locale} className="mt-8" />
        </div>
      </Container>
    </section>
  );
}
