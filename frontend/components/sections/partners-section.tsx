import { useTranslations } from "next-intl";

import { HomeCarousel } from "@/components/sections/home-carousel";
import { HomeHeading, HomeSection } from "@/components/sections/home-kit";
import { Reveal } from "@/components/ui/reveal";
import { partners } from "@/data/home";

/**
 * "Партнёры" — the suppliers' marks on a strip that loops and plays itself.
 *
 * Krauss Maffei, Renolit and Mikrosan on the profile are an argument in their
 * own right — the visitor who has never heard of ROLLER has heard of them — and
 * the logos make it without a sentence of help.
 *
 * ── Why not `PartnersGrid` ──────────────────────────────────────────────────
 *
 * That component is the same idea with its own Swiper configuration, and it
 * still runs `/about`. This one goes through `HomeCarousel` so the homepage has
 * one carousel with one set of dots, one autoplay rhythm and one drag
 * behaviour — the news strip below is the other caller.
 *
 * The marks are greyed until hovered: eight brands' colour palettes arriving at
 * once on a page reduced to black and white is what would break it, and
 * desaturating them keeps the row reading as one strip of evidence.
 */
export function PartnersSection() {
  const t = useTranslations("home.partners");

  return (
    <HomeSection id="partners">
      <Reveal>
        <HomeHeading title={t("title")} />
      </Reveal>

      <Reveal className="mt-12">
        <HomeCarousel
          label={t("title")}
          // Two on a phone, not three: the marks are wordmarks — wide and
          // short — and a third column left each one about 100px to be read in.
          perView={[2, 3, 4]}
          gap={16}
          autoplayDelay={3000}
          slides={partners.map((partner) => ({
            key: partner.name,
            node: (
              // A box with a size of its own, and the logo told to fill it.
              // The marks arrive at every aspect ratio from a wide wordmark to
              // a near-square globe, and `max-h-full max-w-full` let each one
              // keep its own intrinsic size — 96px of logo next to 180px in the
              // same row, and both tiny once the column narrowed on a phone.
              // `h-full w-full object-contain` scales every mark into the same
              // box instead, which is what makes the row read as one strip.
              <div className="flex h-20 items-center justify-center px-3 sm:h-24">
                {partner.logo ? (
                  // Deliberately not `next/image`: eight small fixed marks that
                  // never change size, so the loader would cost a round trip
                  // per logo to hand back the file that is already right.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-full w-full object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                  />
                ) : (
                  // A partner without a mark falls back to its name set in
                  // type, exactly like the two aluminium brands do in the
                  // catalog.
                  <span className="text-center font-heading text-sm font-semibold text-brand-black/45">
                    {partner.name}
                  </span>
                )}
              </div>
            ),
          }))}
        />
      </Reveal>
    </HomeSection>
  );
}
