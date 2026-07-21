import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MediaFrame } from "@/components/ui/media-frame";
import type { ShowcaseProduct } from "@/types";

export type ProductCardProps = ShowcaseProduct;

/**
 * Reusable product/brand card for the showcase and future catalog pages.
 * Renders the brand image, class badge, summary spec line, highlights and a
 * "Подробнее" link. No price is shown — pricing is calculation-based.
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
  return (
    <Card
      variant="elevated"
      className="group flex h-full flex-col overflow-hidden rounded-4xl border border-brand-black/10 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-black/10"
    >
      <div className="relative aspect-4/3 bg-brand-black">
        <MediaFrame
          src={image}
          alt={name}
          fill
          sizes={sizes}
          containerClassName="h-full w-full bg-brand-black"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-brand-black/45 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-red">{type}</p>
            <h3 className="mt-2 font-heading text-3xl font-bold tracking-tight">{name}</h3>
          </div>
          <Badge variant={badgeVariant} className="shrink-0">
            {badge}
          </Badge>
        </div>

        <p className="mt-4 text-sm leading-6 text-brand-black/68">{description}</p>

        <p className="mt-5 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-medium text-brand-black">
          {summary}
        </p>

        <ul className="mt-5 space-y-2 text-sm leading-6 text-brand-black/62">
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-3">
              <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-red" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <Link
          href={href}
          className="mt-6 inline-flex items-center gap-2 rounded-md py-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Подробнее
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Card>
  );
}
