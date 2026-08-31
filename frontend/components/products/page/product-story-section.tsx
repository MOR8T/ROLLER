"use client";

import Image from "next/image";

import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { ImzoHeading, ImzoSection } from "./section-kit";
import type { ProductStorySectionData } from "@/types/product-page";

/**
 * The long read: the system in prose, over its own photograph.
 *
 * The reference gives this block 900px of height, a heading at 2.43vw and
 * paragraphs at 16px/400 with 30px between them — noticeably quieter type than
 * the hero, which is the point: this is the part a visitor reads, not the part
 * they land on. The type is unchanged; what moved is the picture. It used to sit
 * beside the text, `object-contain` on a black ground; the client asked for it
 * behind the text instead, the way the hero carries its photograph.
 *
 * ⚠️ The washes are the whole job here, and they are built for a photograph
 * nobody has vetted: the image is admin content, and the same block has to stay
 * readable under a dark studio render and under a daylit showroom shot with a
 * white wall and a window in it. Three layers, in order:
 *
 *   the base    a flat `rgba(0,0,0,0.55)` over the entire frame, with a 2px
 *               backdrop blur. The blur is not decoration — it is what stops a
 *               busy photograph (mullions, blinds, tiling) from putting hard
 *               edges directly behind 16px type. A flat wash is also the only
 *               layer that helps a *bright* photograph, which is the case the
 *               old black ground never had to answer.
 *   the column  a left-to-right gradient that runs out at 55%, so the half of
 *               the frame the text does not occupy keeps the photograph. Under
 *               `lg` the text spans the full width, so it runs top-to-bottom
 *               instead and stays even.
 *   the seat    the reference's own bottom wash, which seats the band on the
 *               section below it.
 *
 * Together the darkest point behind a line of text is ≈0.85 alpha over black —
 * white type clears WCAG AA against a pure-white photograph, which is the worst
 * case that can be uploaded. `text-shadow` on the copy covers the rest.
 *
 * With no image the block falls back to the flat black ground it used to have,
 * and none of the overlays render.
 */
export function ProductStorySection({
  data,
  locale,
}: {
  data: ProductStorySectionData;
  locale: Locale;
}) {
  const render = data.media?.[0];

  if (!render) {
    return (
      <ImzoSection id={data.id} tone="black" tall className="lg:py-20">
        <StoryCopy data={data} locale={locale} />
      </ImzoSection>
    );
  }

  // `bg-white` like the hero: the ground shows only until the photograph
  // paints, and the washes sit on top of it either way.
  return (
    <section
      id={data.id}
      className="relative isolate flex w-full items-center overflow-hidden bg-white py-[3.125rem] lg:min-h-[39.375rem] lg:py-20"
    >
      <Image
        src={render.src}
        alt={localized(render.alt, locale)}
        fill
        sizes="100vw"
        className="object-cover"
        loading="lazy"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] backdrop-saturate-[0.9]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0.25)_100%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0.55)_28%,rgba(0,0,0,0.25)_42%,transparent_55%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.45)_0%,transparent_45%)]"
      />

      <div className="relative z-[1] w-full">
        <Container>
          <StoryCopy data={data} locale={locale} onPhoto />
        </Container>
      </div>
    </section>
  );
}

/**
 * The heading and the paragraphs — the same type either way. `onPhoto` only adds
 * the shadow, which is dead weight on the flat ground and the last line of
 * defence over a photograph.
 */
function StoryCopy({
  data,
  locale,
  onPhoto = false,
}: {
  data: ProductStorySectionData;
  locale: Locale;
  onPhoto?: boolean;
}) {
  const shadow = onPhoto ? "[text-shadow:0_1px_3px_rgba(0,0,0,0.55)]" : "";

  return (
    <div className={onPhoto ? "max-w-[42rem]" : "max-w-[46rem]"}>
      <ImzoHeading size="display" dark className={shadow}>
        {localized(data.title, locale)}
      </ImzoHeading>

      <div className="mt-8 space-y-[1.875rem]">
        {data.paragraphs.map((paragraph) => (
          <p key={paragraph.ru} className={`text-base leading-[1.4] text-white ${shadow}`}>
            {localized(paragraph, locale)}
          </p>
        ))}
      </div>
    </div>
  );
}
