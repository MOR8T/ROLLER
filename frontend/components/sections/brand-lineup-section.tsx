import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { BrandMark } from "@/components/catalog/brand-mark";
import { accentTag, SectionHeading } from "@/components/sections/section-heading";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { productHref, products, type ProductBase } from "@/data/catalog";
import type { ProductCardBadgeVariant, Segment } from "@/types";

const segmentBadge: Record<Segment, ProductCardBadgeVariant> = {
  economy: "outline",
  mid: "outline",
  "upper-mid": "black",
  premium: "red",
};

function BrandCard({ product }: { product: ProductBase }) {
  const t = useTranslations("brands");
  const tMaterials = useTranslations("materials");
  const tMaterialNotes = useTranslations("materialNotes");
  const tSegments = useTranslations("segments");

  const name = t(`items.${product.slug}.name`);
  const segment = tSegments(product.segment);

  const specs = [
    tMaterials(product.categorySlug),
    ...(product.materialNote ? [tMaterialNotes(product.materialNote)] : []),
    // "мм" is a word, not a symbol — it is "mm" on the English and Turkish
    // sites. Joining it here rather than storing "60 мм" in the data is what
    // keeps the spec strip from showing Cyrillic on `/en` and `/tr`.
    t("depth", { value: product.depthMm }),
    // ICU plural, not a hand-rolled Russian rule: `few`/`many` differ per
    // locale and Turkish has no plural agreement after a numeral at all.
    t("chambers", { count: product.chambers }),
  ];

  return (
    <Link
      href={productHref(product)}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      aria-label={t("cardAria", { name, segment })}
    >
      <div className="relative bg-surface-muted p-6">
        <MediaFrame
          src={product.images[0] ?? null}
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
          <BrandMark logo={product.logo} name={name} />
          <Badge variant={segmentBadge[product.segment]}>{segment}</Badge>
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
          {t(`items.${product.slug}.audience`)}
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
          {products.map((product) => (
            <RevealItem key={product.slug} className="h-full">
              <BrandCard product={product} />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
