import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MediaFrame } from "@/components/ui/media-frame";
import type { ShowcaseProduct } from "@/types";

export type ProductCardProps = ShowcaseProduct;

/**
 * Catalog-style product card: dark product stage + compact spec strip.
 * Distinct from projects (overlay tiles) and news (editorial rows).
 */
export function ProductCard({
  name,
  type,
  badge,
  badgeVariant,
  description,
  summary,
  highlights,
  image,
  href,
  sizes,
}: ProductCardProps & { sizes?: string }) {
  const summaryParts = summary.split("·").map((part) => part.trim()).filter(Boolean);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-brand-black/8 bg-brand-white">
      <Link
        href={href}
        className="relative block aspect-square bg-brand-black p-6 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none sm:p-8"
        aria-label={name}
      >
        <div className="relative h-full w-full">
          <MediaFrame
            src={image}
            alt={name}
            fill
            sizes={sizes}
            objectFit="contain"
            containerClassName="h-full w-full bg-transparent"
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3">
          <span className="rounded-full border border-brand-white/15 bg-brand-black/40 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-brand-white/80 uppercase backdrop-blur-sm">
            {type}
          </span>
          <Badge variant={badgeVariant} className="shrink-0 shadow-sm">
            {badge}
          </Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col border-t border-brand-black/8 p-5 sm:p-6">
        <h3 className="font-heading text-3xl font-bold tracking-tight text-brand-black">{name}</h3>
        <p className="mt-2 text-sm leading-6 text-brand-black/65">{description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {summaryParts.map((part) => (
            <span
              key={part}
              className="rounded-md border border-brand-black/10 bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-brand-black/75"
            >
              {part}
            </span>
          ))}
        </div>

        <ul className="mt-5 space-y-2 border-t border-brand-black/8 pt-5 text-sm leading-6 text-brand-black/62">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-red" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Подробнее
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
