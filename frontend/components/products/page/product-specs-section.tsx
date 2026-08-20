"use client";

import Image from "next/image";

import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { ImzoHeading, ImzoSection, imzoMuted } from "./section-kit";
import type { ProductSpecsSectionData } from "@/types/product-page";

/**
 * The cutaway and the numbers, on the grey ground.
 *
 * The rows are the reference's exactly: no boxes and no table rules — label and
 * value pushed apart on one line, both 16px/500, the label `#909090` and the
 * value black, 30px apart, each underlined by a 1px dashed
 * `rgba(0,0,0,0.1)` — which is a border on the row, not a divider between rows,
 * so the last row carries one too.
 */
export function ProductSpecsSection({
  data,
  locale,
}: {
  data: ProductSpecsSectionData;
  locale: Locale;
}) {
  const corner = data.media?.[0];

  return (
    <ImzoSection id={data.id} tall tone="grey">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,43.75rem)_1fr] lg:items-center lg:gap-12">
        {corner ? (
          <div className="relative order-last aspect-[5/3] w-full lg:order-first">
            <Image
              src={corner.src}
              alt={localized(corner.alt, locale)}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-contain"
              loading="lazy"
            />
          </div>
        ) : null}

        <div>
          <ImzoHeading>{localized(data.title, locale)}</ImzoHeading>

          <dl className="mt-9">
            {data.specs.map((spec) => (
              <div
                key={spec.name.ru}
                className="flex items-baseline justify-between gap-8 border-b border-dashed border-black/10 pb-2.5 not-last:mb-[1.875rem]"
              >
                <dt className={cn("text-base leading-[1.4] font-medium", imzoMuted)}>
                  {localized(spec.name, locale)}
                </dt>
                <dd className="text-right text-base leading-[1.4] font-medium text-black">
                  {localized(spec.value, locale)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </ImzoSection>
  );
}
