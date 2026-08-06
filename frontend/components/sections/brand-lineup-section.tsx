import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { accentTag, SectionHeading } from "@/components/sections/section-heading";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { brandLineup, type BrandBase } from "@/data/home";
import type { ProductCardBadgeVariant, Segment } from "@/types";

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
  economy: "outline",
  mid: "outline",
  "upper-mid": "black",
  premium: "red",
};

function BrandMark({ brand, name }: { brand: BrandBase; name: string }) {
  // Fixed height for both branches: the aluminium systems have no mark of their
  // own, and a card built on typography has to sit at exactly the same height
  // as one built on a logo (DESIGN.md §7).
  return (
    <div className="flex h-9 items-center">
      {brand.logo ? (
        <Image
          src={brand.logo}
          alt={name}
          width={160}
          height={36}
          className="h-full w-auto object-contain object-left"
        />
      ) : (
        <span className="font-heading text-2xl font-bold tracking-tight text-brand-black">
          {name}
        </span>
      )}
    </div>
  );
}

function BrandCard({ brand }: { brand: BrandBase }) {
  const t = useTranslations("brands");
  const tMaterials = useTranslations("materials");
  const tMaterialNotes = useTranslations("materialNotes");
  const tSegments = useTranslations("segments");

  const name = t(`items.${brand.slug}.name`);
  const segment = tSegments(brand.segment);

  const specs = [
    tMaterials(brand.material),
    ...(brand.materialNote ? [tMaterialNotes(brand.materialNote)] : []),
    // "мм" is a word, not a symbol — it is "mm" on the English and Turkish
    // sites. Joining it here rather than storing "60 мм" in the data is what
    // keeps the spec strip from showing Cyrillic on `/en` and `/tr`.
    t("depth", { value: brand.depthMm }),
    // ICU plural, not a hand-rolled Russian rule: `few`/`many` differ per
    // locale and Turkish has no plural agreement after a numeral at all.
    t("chambers", { count: brand.chambers }),
  ];

  return (
    <Link
      href={brand.href}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={t("cardAria", { name, segment })}
    >
      <div className="relative bg-surface-muted p-6">
        <MediaFrame
          src={brand.image}
          alt={t("imageAlt", { name })}
          placeholderLabel={t("imagePlaceholder", { name })}
          width={480}
          height={320}
          objectFit="contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          containerClassName="border-0 bg-transparent"
        />
      </div>

      <div className="flex flex-1 flex-col border-t border-brand-black/8 p-6">
        {/* `flex-wrap`: the segment label is one short word in Russian
            ("премиум") and three in Tajik ("болотар аз миёна"). Wrapping under
            the mark beats squeezing it. */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <BrandMark brand={brand} name={name} />
          <Badge variant={segmentBadge[brand.segment]}>{segment}</Badge>
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

        <p className="mt-5 flex-1 text-sm leading-6 text-brand-black/70">
          {t(`items.${brand.slug}.audience`)}
        </p>

        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
          {t("viewSystem")}
          <ArrowUpRight className="size-4 shrink-0" />
        </span>
      </div>
    </Link>
  );
}

export function BrandLineupSection() {
  const t = useTranslations("brands");

  return (
    <Section id="brands" className="scroll-mt-20">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            // The accented word is marked up inside the message, so each
            // translation decides which of its own words carries the red —
            // its position in the sentence differs per language.
            title={t.rich("title", { accent: accentTag })}
            description={t("description")}
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
