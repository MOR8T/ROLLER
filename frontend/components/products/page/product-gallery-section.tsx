"use client";

import type { Locale } from "@/i18n/routing";
import { ExpoSlider } from "@/components/ui/expo-slider";
import { localized } from "@/lib/localized";
import type { ProductGallerySectionData } from "@/types/product-page";

/** Same beat as the homepage deck: long enough to look at a photograph. */
const AUTOPLAY_MS = 7000;

/**
 * The photographic band: one frame at a time, edge to edge, with a pair of
 * round arrows in the bottom right corner — the reference's slider, including
 * its lack of a heading. The pictures carry the block.
 *
 * The slider itself is the homepage's, `components/ui/expo-slider.tsx`: the
 * same scroll-snap track, the same Expo parallax against a neighbouring frame,
 * the same seamless loop and mouse dragging. Swiper used to run this section
 * and no longer does — two slider engines on one site is one too many, and the
 * hero's is the one with the motion the client picked.
 *
 * No scrim and no content layer: nothing is written over these photographs, so
 * darkening them would be decoration.
 *
 * These are photographs of the Dushanbe showroom rather than of this particular
 * system: there is no per-system interior photography, and the honest version
 * of the reference's lifestyle strip is the room where all six systems stand.
 */
export function ProductGallerySection({
  data,
  locale,
}: {
  data: ProductGallerySectionData;
  locale: Locale;
}) {
  const slides = (data.media ?? []).map((media) => ({
    key: media.src,
    image: media.src,
    alt: localized(media.alt, locale),
  }));

  if (slides.length === 0) return null;

  return (
    <section id={data.id} className="bg-white">
      <ExpoSlider
        slides={slides}
        labels={{
          previous: localized(data.controls.previous, locale),
          next: localized(data.controls.next, locale),
          slide: (index, total) => `${index} / ${total}`,
        }}
        // 630px on a desktop — the height the page's other blocks hold — and a
        // squarer crop on a phone rather than a letterbox of one wall.
        frameClassName="aspect-[4/3] sm:aspect-[16/10] lg:aspect-[24/10] lg:min-h-[39.375rem]"
        imageSizes="100vw"
        autoplayMs={AUTOPLAY_MS}
        controls="overlay"
      />
    </section>
  );
}
