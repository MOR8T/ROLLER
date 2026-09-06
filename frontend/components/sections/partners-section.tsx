import { getTranslations } from "next-intl/server";

import { HomeCarousel } from "@/components/sections/home-carousel";
import { HomeHeading, HomeSection } from "@/components/sections/home-kit";
import { Reveal } from "@/components/ui/reveal";
import { getPartners } from "@/lib/partners";

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
 *
 * ⚠️ Partners moved from a static fixture (`data/home.ts`) to the admin panel
 * on 2026-08-24 (`lib/partners.ts` fetches them; managed from
 * `app/admin/(dashboard)/about/page.tsx`). `getPartners` returns `[]`, never
 * fabricated content, when the backend has nothing yet — `PartnersSkeleton`
 * below renders instead, same shape as `HeroSection`'s own skeleton.
 */
export async function PartnersSection() {
  const t = await getTranslations("home.partners");
  const partners = await getPartners();

  return (
    <HomeSection id="partners">
      <Reveal>
        <HomeHeading title={t("title")} />
      </Reveal>

      <Reveal className="mt-12">
        {partners.length === 0 ? (
          <PartnersSkeleton />
        ) : (
          <HomeCarousel
            label={t("title")}
            // Two on a phone, not three: the marks are wordmarks — wide and
            // short — and a third column left each one about 100px to be read in.
            perView={[2, 3, 4]}
            gap={16}
            autoplayDelay={3000}
            slides={partners.map((partner) => ({
              key: String(partner.id),
              node: (
                // A box with a size of its own, and the logo told to fill it.
                // The marks arrive at every aspect ratio from a wide wordmark to
                // a near-square globe, and `max-h-full max-w-full` let each one
                // keep its own intrinsic size — 96px of logo next to 180px in the
                // same row, and both tiny once the column narrowed on a phone.
                // `h-full w-full object-contain` scales every mark into the same
                // box instead, which is what makes the row read as one strip.
                <div className="flex h-20 items-center justify-center px-3 sm:h-24">
                  {/* Admin-uploaded photos are absolute URLs into the
                      backend; deliberately not `next/image` here either —
                      small fixed marks that never change size, so the
                      optimizer would only add a round trip per logo. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    // Full colour by client request (2026-08-14). The strip used
                    // to be desaturated to keep eight brands' palettes from
                    // competing with a page reduced to black and white; the
                    // marks now carry their own colour and only lift on hover.
                    className="h-full w-full object-contain opacity-85 transition duration-300 hover:opacity-100 touch:opacity-100"
                  />
                </div>
              ),
            }))}
          />
        )}
      </Reveal>
    </HomeSection>
  );
}

/**
 * Stands in for the strip while there are no partners to show — same frame,
 * same box heights, so the swap to real content the moment the admin adds a
 * partner doesn't jolt the layout. Pulses as one unit rather than per-piece:
 * a loading state is one fact ("still loading"), not several — same
 * treatment as `HeroSection`'s own skeleton.
 */
function PartnersSkeleton() {
  return (
    <div className="animate-pulse" style={{ animationDuration: "3.2s" }}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 rounded-control bg-brand-black/10 sm:h-24" />
        ))}
      </div>
    </div>
  );
}
