import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { HomeCarousel } from "@/components/sections/home-carousel";
import { HomeHeading, HomeSection, homeCard } from "@/components/sections/home-kit";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { productCategoryHref } from "@/lib/product-links";
import { getProductCategories, type ProductCategoryDto } from "@/lib/product-categories";

/**
 * "Продукция" — photographs on a strip that loops and plays itself.
 *
 * The photograph fills the card the way it does on imzo.uz: no frame, no
 * description, no icon panel. A visitor scanning this is choosing by
 * recognition — "that is the kind of window I have" — and a picture answers
 * that before a sentence can.
 *
 * ⚠️ Categories moved from a static fixture (`data/home.ts`) to the admin
 * panel on 2026-08-27 (`lib/product-categories.ts` fetches them; managed
 * from `app/admin/(dashboard)/product-categories/page.tsx`), and gained a
 * destination of their own on 2026-08-28: each card opens
 * `/products/<id>`, the category's product list. That page is also the only
 * way into a product now — the catalogue index the cards used to share was
 * removed with the same change. `getProductCategories` returns
 * `[]`, never fabricated content, when the backend has nothing yet —
 * `ProductsGridSkeleton` below renders instead, same shape as
 * `HeroSection`'s/`PartnersSection`'s own skeletons.
 */
function ProductCard({
  category,
  eager,
}: {
  category: ProductCategoryDto;
  /** Cards that are on screen at rest. See the note on `loading` below. */
  eager: boolean;
}) {
  return (
    <Link
      href={productCategoryHref(category.id)}
      className={`group relative flex aspect-4/5 flex-col justify-end overflow-hidden bg-neutral-100 p-6 focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none sm:aspect-3/4 sm:p-7 ${homeCard}`}
    >
      <Image
        src={category.image}
        alt=""
        fill
        sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 29vw"
        // ⚠️ Only the cards that are actually on screen.
        //
        // This was `loading="eager"` on all seven, to stop a card sliding in as
        // a grey rectangle. It backfired: seven off-screen images requested at
        // once, on top of the hero's four banners, exceeded the browser's
        // per-host connection limit and the last two in the row sat pending
        // indefinitely.
        //
        // Three covers the widest breakpoint's `slidesPerView`, so nothing
        // visible is ever blank, and the rest load as the strip reaches them.
        loading={eager ? "eager" : "lazy"}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      {/* The photographs are showroom interiors — bright, busy and white at the
          bottom, which is exactly where the name goes. The scrim is what keeps
          the type legible without retouching any of them. */}
      <span className="absolute inset-0 bg-gradient-to-t from-brand-black/75 via-brand-black/20 to-transparent" />

      <span className="relative flex items-end justify-between gap-3">
        <span className="font-heading text-xl font-bold tracking-tight text-brand-white sm:text-2xl">
          {category.name}
        </span>
        <ArrowUpRight
          className="size-5 shrink-0 translate-y-1 text-brand-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 touch:translate-y-0 touch:opacity-100"
          aria-hidden
        />
      </span>
    </Link>
  );
}

export async function ProductsGridSection() {
  const t = await getTranslations("home.products");
  const locale = await getLocale();
  const categories = await getProductCategories(locale);

  return (
    <HomeSection id="products">
      <Reveal>
        {/* No «Вся продукция» action: the page it opened is gone, and the
            strip below is itself the full list of categories. */}
        <HomeHeading title={t("title")} />
      </Reveal>

      <Reveal className="mt-12">
        {categories.length === 0 ? (
          <ProductsGridSkeleton />
        ) : (
          <HomeCarousel
            label={t("title")}
            // Fractions on purpose: a card cut by the edge is what says "there is
            // more", and it is the only affordance a strip has before it moves.
            perView={[1.25, 2.4, 3.4]}
            gap={16}
            autoplayDelay={4000}
            slides={categories.map((category, index) => ({
              key: String(category.id),
              node: <ProductCard category={category} eager={index < 3} />,
            }))}
          />
        )}
      </Reveal>
    </HomeSection>
  );
}

/**
 * Stands in for the strip while there are no categories to show — same card
 * frame (photo, name in the bottom-left), so the swap to real content the
 * moment the admin adds a category doesn't jolt the layout. Pulses as one
 * unit rather than per-piece, same treatment as `HeroSection`'s and
 * `PartnersSection`'s own skeletons.
 */
function ProductsGridSkeleton() {
  return (
    <div className="animate-pulse" style={{ animationDuration: "3.2s" }}>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className={`aspect-4/5 bg-brand-black/10 sm:aspect-3/4 ${homeCard}`} />
        ))}
      </div>
    </div>
  );
}
