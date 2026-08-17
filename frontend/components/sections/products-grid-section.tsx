import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { HomeCarousel } from "@/components/sections/home-carousel";
import { HomeHeading, HomeSection, homeCard } from "@/components/sections/home-kit";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { categoryHref } from "@/data/products";
import { homeProductTiles, type HomeProductTile } from "@/data/home";

/**
 * "Продукция" — seven photographs on a strip that loops and plays itself.
 *
 * The photograph fills the card the way it does on imzo.uz: no frame, no
 * description, no icon panel. A visitor scanning this is choosing by
 * recognition — "that is the kind of window I have" — and a picture answers
 * that before a sentence can. The line that used to sit under each one still
 * exists on `/solutions/<slug>`, which is where anyone who wants it has gone.
 *
 * Six of the seven take their title from `categories.*`, the same messages the
 * catalog page and the header menu read, so a card's name is translated once;
 * "Аксессуары" is the one with copy of its own.
 */
function ProductCard({
  tile,
  href,
  title,
  eager,
}: {
  tile: HomeProductTile;
  href: string;
  title: string;
  /** Cards that are on screen at rest. See the note on `loading` below. */
  eager: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex aspect-4/5 flex-col justify-end overflow-hidden bg-neutral-100 p-6 focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none sm:aspect-3/4 sm:p-7 ${homeCard}`}
    >
      <Image
        src={tile.image}
        alt=""
        fill
        sizes="(max-width: 640px) 78vw, (max-width: 1024px) 42vw, 29vw"
        // ⚠️ Only the cards that are actually on screen.
        //
        // This was `loading="eager"` on all seven, to stop a card sliding in as
        // a grey rectangle. It backfired: seven off-screen images requested at
        // once, on top of the hero's four banners, exceeded the browser's
        // per-host connection limit and the last two in the row — Перегородки
        // and Москитные сетки — sat pending indefinitely. The cards the client
        // reported as "having no photograph" were the two at the end of that
        // queue, whichever photographs they held.
        //
        // Three covers the widest breakpoint's `slidesPerView`, so nothing
        // visible is ever blank, and the rest load as the strip reaches them.
        loading={eager ? "eager" : "lazy"}
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      {/* The photographs are showroom interiors — bright, busy and white at the
          bottom, which is exactly where the name goes. The scrim is what keeps
          the type legible on all seven without retouching any of them. */}
      <span className="absolute inset-0 bg-gradient-to-t from-brand-black/75 via-brand-black/20 to-transparent" />

      <span className="relative flex items-end justify-between gap-3">
        <span className="font-heading text-xl font-bold tracking-tight text-brand-white sm:text-2xl">
          {title}
        </span>
        <ArrowUpRight
          className="size-5 shrink-0 translate-y-1 text-brand-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          aria-hidden
        />
      </span>
    </Link>
  );
}

export function ProductsGridSection() {
  const t = useTranslations("home.products");
  const tCategories = useTranslations("categories");

  function resolve(tile: HomeProductTile) {
    return tile.kind === "category"
      ? {
          key: tile.slug,
          href: categoryHref(tile.slug),
          title: tCategories(`items.${tile.slug}.title`),
        }
      : { key: tile.key, href: tile.href, title: t(tile.key) };
  }

  return (
    <HomeSection id="products">
      <Reveal>
        <HomeHeading title={t("title")} action={{ label: t("all"), href: "/products" }} />
      </Reveal>

      <Reveal className="mt-12">
        <HomeCarousel
          label={t("title")}
          // Fractions on purpose: a card cut by the edge is what says "there is
          // more", and it is the only affordance a strip has before it moves.
          //
          // ⚠️ The widest value has to round down to three. `HomeCarousel`
          // duplicates any list shorter than twice its widest `slidesPerView`,
          // and seven cards against a rounded-up four would trip that and show
          // every product twice. 2.8 rounds to 3, 7 ≥ 6, nothing is duplicated.
          perView={[1.25, 2.4, 3.4]}
          gap={16}
          autoplayDelay={4000}
          slides={homeProductTiles.map((tile, index) => {
            const { key, href, title } = resolve(tile);

            return {
              key,
              node: <ProductCard tile={tile} href={href} title={title} eager={index < 3} />,
            };
          })}
        />
      </Reveal>
    </HomeSection>
  );
}
