import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { SectionHeading } from "@/components/sections/section-heading";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { brandLineup } from "@/data/home";
import type { Brand, ProductCardBadgeVariant, Segment } from "@/types";

/**
 * The core of the homepage (DESIGN.md §7).
 *
 * Nothing on the old site explained why there are four PVC brands or how ROLLER
 * differs from UNOPEN — which is the site's stated job (§1). The six systems are
 * ordered as a ladder from economy to premium, because that order *is* the
 * explanation.
 */

// Red stays an accent, not a coding system: only the premium rung is marked in
// brand red, so the badges add up to a fraction of the ~5% budget in §3.
const segmentBadge: Record<Segment, ProductCardBadgeVariant> = {
  эконом: "outline",
  средний: "outline",
  "выше среднего": "black",
  премиум: "red",
};

function chambersLabel(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  if (lastTwo >= 11 && lastTwo <= 14) return `${count} камер`;
  if (last === 1) return `${count} камера`;
  if (last >= 2 && last <= 4) return `${count} камеры`;
  return `${count} камер`;
}

function BrandMark({ brand }: { brand: Brand }) {
  // Fixed height for both branches: the aluminium systems have no mark of their
  // own, and a card built on typography has to sit at exactly the same height
  // as one built on a logo (DESIGN.md §7).
  return (
    <div className="flex h-9 items-center">
      {brand.logo ? (
        <Image
          src={brand.logo}
          alt={brand.name}
          width={160}
          height={36}
          className="h-full w-auto object-contain object-left"
        />
      ) : (
        <span className="font-heading text-2xl font-bold tracking-tight text-brand-black">
          {brand.name}
        </span>
      )}
    </div>
  );
}

function BrandCard({ brand }: { brand: Brand }) {
  const specs = [
    brand.material,
    ...(brand.materialNote ? [brand.materialNote] : []),
    brand.depth,
    chambersLabel(brand.chambers),
  ];

  return (
    <Link
      href={brand.href}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={`${brand.name} — ${brand.segment}`}
    >
      <div className="relative bg-surface-muted p-6">
        <MediaFrame
          src={brand.image}
          alt={`Система ${brand.name}`}
          placeholderLabel={`Рендер системы ${brand.name}`}
          width={480}
          height={320}
          objectFit="contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          containerClassName="border-0 bg-transparent"
        />
      </div>

      <div className="flex flex-1 flex-col border-t border-brand-black/8 p-6">
        <div className="flex items-start justify-between gap-3">
          <BrandMark brand={brand} />
          <Badge variant={segmentBadge[brand.segment]} className="shrink-0">
            {brand.segment}
          </Badge>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {specs.map((spec) => (
            <span
              key={spec}
              className="rounded-control border border-brand-black/10 bg-surface-muted px-2.5 py-1 text-xs font-semibold text-brand-black/75"
            >
              {spec}
            </span>
          ))}
        </div>

        <p className="mt-5 flex-1 text-sm leading-6 text-brand-black/70">{brand.audience}</p>

        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
          Смотреть систему
          <ArrowUpRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}

export function BrandLineupSection() {
  return (
    <Section id="brands" className="scroll-mt-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Линейка систем"
            title={
              <>
                Шесть систем — <span className="text-brand-red">одна</span> под вашу задачу
              </>
            }
            description="Четыре системы из ПВХ и две из алюминия. Отличаются глубиной профиля, числом камер и тем, для чего они предназначены."
          />
        </Reveal>

        <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {brandLineup.map((brand) => (
            <RevealItem key={brand.slug} className="h-full">
              <BrandCard brand={brand} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
