import Image from "next/image";

import { Breadcrumbs } from "@/components/products/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

/**
 * The opening band of `/products/[category]` — the category's own photograph,
 * with the trail and the name on it.
 *
 * ⚠️ This replaced `PageHeader` on this page alone (2026-09-02). The header was
 * type on white, while `ProductCategoryPageDto.image` — the photograph the
 * admin uploads with the category, and the same one the homepage strip opens
 * from — was fetched and never drawn. A visitor who taps a photograph on the
 * homepage and lands on a page of text has lost the thing they recognised.
 *
 * ⚠️ The band carries **the name and nothing else**. It opened with an eyebrow
 * («ПРОДУКЦИЯ · 5 систем») and the `productsCategory.description` lead
 * paragraph under the name; both were removed at the client's request the same
 * day. The paragraph was one sentence repeated on every category — the message
 * catalogue has no per-category copy — and a line that says the same thing on
 * seven pages says nothing on any of them.
 *
 * Deliberately **half the height** of `ProductHeroSection` (which is
 * `100svh`, capped at 700px): a category is a stop on the way, and opening a
 * product from here has to read as a step up rather than as sideways. Hence
 * also no `.hero-push` — the slow zoom stays the product page's alone.
 *
 * `min-h`, not `h`: Tajik and Turkish run longer than Russian (DESIGN.md §10)
 * and a fixed band would push the name out under the sticky header.
 *
 * The trail and the name are centred in the band, and the centring is plain:
 * no compensation for the header above it. The header is `sticky`, not
 * `fixed`, so at rest it takes its own space in the flow and the band starts
 * below it — measured at 1280px, the band's top edge and the header's bottom
 * edge are the same 81px line. Padding the content to "clear" the header
 * pushed the pair 40px below centre, half the header's height.
 *
 * The two washes are `ProductHeroSection`'s, for its reason: the category
 * photographs are lit showrooms — white walls, daylight, spotlights — and one
 * bottom wash is not enough to seat white type on them. Below `lg` the second
 * one runs top-to-bottom rather than left-to-right: the copy spans the full
 * width there, so there is no clear half of the frame left to protect.
 */
export function CategoryHeroSection({ name, image }: { name: string; image: string }) {
  return (
    <section className="relative isolate flex min-h-[clamp(19rem,42svh,25rem)] w-full flex-col justify-center overflow-hidden bg-brand-black">
      {/* Decorative: the name is the `<h1>` two lines below it. */}
      <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />

      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.35)_45%,rgba(0,0,0,0.45)_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.3)_100%)] lg:bg-[linear-gradient(to_right,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.45)_30%,transparent_62%)]"
      />

      <div className="relative z-[1] w-full">
        <Container>
          <Breadcrumbs items={[{ label: name }]} tone="dark" />

          <Reveal className="mt-7 max-w-[42rem]">
            <h1 className="text-3xl font-bold tracking-tight text-brand-white sm:text-4xl lg:text-5xl">
              {name}
            </h1>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
