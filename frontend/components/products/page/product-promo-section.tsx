"use client";

import Image from "next/image";

import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import { ImzoActions, ImzoHeading } from "./section-kit";
import type { ProductPromoSectionData } from "@/types/product-page";

/**
 * The block that sends the visitor to the calculator: half photograph, half
 * words, edge to edge, 24px heading and a black pill — the reference's split,
 * at its proportions.
 *
 * There is one of these, not two. The reference runs a price block and an
 * instalment block in alternating order; the client removed the second, and one
 * block cannot alternate.
 */
export function ProductPromoSection({
  data,
  locale,
}: {
  data: ProductPromoSectionData;
  locale: Locale;
}) {
  const image = data.media?.[0];

  return (
    <section id={data.id} className="bg-white">
      <div className="grid lg:grid-cols-2">
        {/* 630px, not the 480px the halves used to share: the client asked for
            150px more air around the offer. Both halves carry the height so the
            photograph and the text stay the same size beside each other. */}
        <div className="flex items-center bg-[rgba(144,144,144,0.1)] py-[3.125rem] lg:min-h-[39.375rem] lg:py-20">
          {/* Half the page column: the text starts on the same line as every
              other section — `Container`'s left edge — and stops where the
              photograph does. */}
          <Container className="lg:mr-0 lg:ml-auto lg:max-w-[calc(var(--container-page)/2)] lg:pr-12">
            <ImzoHeading>{localized(data.title, locale)}</ImzoHeading>

            <p className="mt-5 max-w-[32rem] text-base leading-[1.4] text-black">
              {localized(data.description, locale)}
            </p>

            <ImzoActions actions={data.actions} locale={locale} className="mt-8" />
          </Container>
        </div>

        {/* 630px is both the floor and the ceiling for the photograph: on a
            desktop it matches the text beside it, and stacked on a phone it
            stops growing instead of turning into a full-screen wall. */}
        {image ? (
          <div className="relative order-first max-h-[39.375rem] min-h-[18rem] lg:order-last lg:min-h-[39.375rem]">
            <Image
              src={image.src}
              alt={localized(image.alt, locale)}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
