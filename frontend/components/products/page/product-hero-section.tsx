"use client";

import Image from "next/image";

import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { Container } from "@/components/ui/container";
import type { ProductHeroSectionData } from "@/types/product-page";

/**
 * The opening screen — imzo.uz's `.banner.short.center`, measured at 1280px and
 * at 375px with `getComputedStyle` rather than interpreted:
 *
 *   band        `height: 100vh; max-height: 700px` — a fixed band, not a
 *               minimum that grows with the copy. The same on a phone: the
 *               reference's `max-width: 768px` rule is outranked by `.short`.
 *   photograph  one `<img>`, `position: absolute; inset: 0; object-fit: cover`
 *   inner       a column, centred vertically, `padding: 50px 0`
 *   column      600px of type: the name, then the paragraph, 20px apart
 *   name        Montserrat 700, 46px above 1536px and
 *               `calc(20.1754px + 1.68129vw)` below it, line-height 1.2
 *   paragraph   500, 18px above 1536px and `calc(15.4737px + 0.164474vw)`
 *               below it, line-height 1.4
 *
 * `100svh`, not `100vh`: identical on a desktop, and it spares a phone the
 * band's height changing as the browser's URL bar slides away. The cap at
 * 700px is what actually decides the height on almost every screen either way.
 *
 * ⚠️ No button. The reference closes this screen with a white «Заказать» pill;
 * the client asked for the section without it, so `lib/products.ts` no longer
 * builds a hero action and nothing here renders one. The page's request block
 * at `#contacts` is still where a visitor writes to us.
 *
 * Three additions to the reference, and only three:
 *
 *   the trail   a category and a link back to it, above the name. The site has
 *               no catalogue index, so a visitor arriving from search has no
 *               other way to tell which section they are in — see
 *               `ProductHeroSectionData`.
 *   the jumps   anchors into the blocks below, in the space the button used to
 *               occupy, so the screen ends on a way further in rather than on
 *               a third of a screen of empty ground.
 *   the push    `.hero-push` in `globals.css` — twenty seconds from 1 to 1.06,
 *               dropped entirely under `prefers-reduced-motion: reduce`.
 *
 * ⚠️ The darkening is ours as well. imzo carries a single bottom wash and can
 * afford it — its product shots are lit against a dark studio backdrop. Ours
 * are showroom photographs: white walls, daylight, spotlights, and white type
 * died on them. So a second wash runs left to right and stops at 50%, keeping
 * the half of the frame the window is in clear.
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
    <section
      id={data.id}
      className="relative isolate flex h-[100svh] max-h-[43.75rem] w-full overflow-hidden bg-black"
    >
      {image ? (
        <Image
          src={image.src}
          alt={localized(image.alt, locale)}
          fill
          priority
          sizes="100vw"
          className="hero-push object-cover"
        />
      ) : null}

      {/* Two washes, and they do different jobs.
          The first is the reference's own `linear-gradient(to top, rgba(0,0,0,.5),
          transparent)` — it seats the band on the section below it and is the
          only one imzo needs, because imzo shoots its products against a dark
          studio backdrop.
          The second is ours. Our photographs are lit showrooms: white walls,
          white ceilings, spotlights. It runs out at the 50% mark, so the right
          half of the frame — the part with the actual window in it — is
          untouched, and the type on the left has ground to sit on. The stops
          fall off in three steps rather than one so the edge of the wash never
          draws as a line across the photograph. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.5)_0%,transparent_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.35)_100%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.62)_22%,rgba(0,0,0,0.3)_38%,transparent_50%)]"
      />

      <div className="relative z-[1] flex h-full w-full flex-col justify-center py-[3.125rem]">
        <Container>
          <div className="max-w-[37.5rem]">
            {data.trail ? (
              <nav
                aria-label={localized(data.labels.trail, locale)}
                className="mb-4 text-sm leading-none font-medium text-white/70"
              >
                {/* `@/i18n/navigation`'s `Link`, not `next/link`:
                    `productCategoryHref` returns a locale-less
                    `/products/<id>`, and plain `next/link` would drop the
                    visitor into the default locale. */}
                <Link
                  href={data.trail.href}
                  className="underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:rounded-xs focus-visible:text-white focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {localized(data.trail.category, locale)}
                </Link>
                <span className="mx-2 text-white/40">/</span>
                <span className="text-white">{localized(data.title, locale)}</span>
              </nav>
            ) : null}

            {/* `font-sans!`, with the important modifier, and not plain
                `font-sans`. `globals.css` points `h1`–`h6` at Chakra Petch in
                an *unlayered* rule, and unlayered declarations outrank every
                `@layer utilities` one no matter the selector — so the utility
                loses and the name renders in Chakra Petch. The reference sets
                this line in Montserrat like the rest of its type. */}
            <h1 className="font-sans! text-[calc(20.1754px+1.68129vw)] leading-[1.2] font-bold text-white min-[1536px]:text-[2.875rem]">
              {localized(data.title, locale)}
            </h1>

            <p className="mt-5 text-[calc(15.4737px+0.164474vw)] leading-[1.4] font-medium text-white min-[1536px]:text-[1.125rem]">
              {localized(data.description, locale)}
            </p>

            {data.jumps.length > 0 ? (
              /* Plain `<a href="#…">`, not `@/i18n/navigation`'s `Link`: these
                 are same-page fragments, which `lib/utils.ts`'s
                 `isExternalHref()` treats as not needing the locale — routing
                 them would push a history entry and re-render the page to land
                 on an element already on screen.

                 Hidden below `sm`. The band is a fixed 700px and on a phone the
                 name and the paragraph already fill it; the anchors are also
                 worth less there, since the blocks they point at are one thumb
                 flick apart. */
              <nav
                aria-label={localized(data.labels.jumps, locale)}
                className="mt-8 hidden flex-wrap gap-x-6 gap-y-2 sm:flex"
              >
                {data.jumps.map((jump) => (
                  <a
                    key={jump.id}
                    href={`#${jump.id}`}
                    className="text-sm leading-none font-medium text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:rounded-xs focus-visible:text-white focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                  >
                    {localized(jump.label, locale)}
                  </a>
                ))}
              </nav>
            ) : null}
          </div>
        </Container>
      </div>
    </section>
  );
}
