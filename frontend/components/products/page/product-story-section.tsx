"use client";

import Image from "next/image";

import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { ImzoHeading, ImzoSection } from "./section-kit";
import type { ProductStorySectionData } from "@/types/product-page";

/**
 * The long read: the system in prose, white on black, with the render beside it.
 *
 * The reference gives this block 900px of height, a heading at 2.43vw and
 * paragraphs at 16px/400 with 30px between them — noticeably quieter type than
 * the hero, which is the point: this is the part a visitor reads, not the part
 * they land on.
 */
export function ProductStorySection({
  data,
  locale,
}: {
  data: ProductStorySectionData;
  locale: Locale;
}) {
  const render = data.media?.[0];

  return (
    <ImzoSection id={data.id} tone="black" tall className="lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
        <div>
          <ImzoHeading size="display" dark>
            {localized(data.title, locale)}
          </ImzoHeading>

          <div className="mt-8 space-y-[1.875rem]">
            {data.paragraphs.map((paragraph) => (
              <p key={paragraph.ru} className="text-base leading-[1.4] text-white">
                {localized(paragraph, locale)}
              </p>
            ))}
          </div>
        </div>

        {render ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] bg-white/5">
            <Image
              src={render.src}
              alt={localized(render.alt, locale)}
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-contain p-6"
              loading="lazy"
            />
          </div>
        ) : null}
      </div>
    </ImzoSection>
  );
}
