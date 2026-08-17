import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";

import { CategoryCard } from "@/components/catalog/category-card";
import { BrandMark } from "@/components/catalog/brand-mark";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ColorSwatches } from "@/components/catalog/color-swatches";
import { ProductGallery } from "@/components/catalog/product-gallery";
import { RelatedProducts } from "@/components/catalog/related-products";
import { SpecTable } from "@/components/catalog/spec-table";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { categoriesOfProduct, findProduct, productParams } from "@/data/catalog";
import { cn } from "@/lib/utils";
import type { ProductCardBadgeVariant, Segment, Spec } from "@/types";

const LEAD_FORM_ANCHOR = "#lead-form";
const CALCULATOR_HREF = "/calculator";

// Same mapping as the catalog card, and for the same reason: only the premium
// rung is marked in brand red, which keeps badges inside the ~5% budget of
// DESIGN.md §3.
const segmentBadge: Record<Segment, ProductCardBadgeVariant> = {
  economy: "outline",
  mid: "outline",
  "upper-mid": "black",
  premium: "red",
};

// Keyed by material: the brief writes the PVC advantages once, under ROLLER,
// and the other three PVC systems say «то же самое как Роллер». Turning that
// into six near-identical lists in four locales would be inventing agreement
// the client never expressed.
const advantageKeys = {
  pvc: ["thermal", "acoustic", "durability", "aesthetics", "ecology"],
  aluminium: ["strength", "spans", "weather", "maintenance"],
} as const;

export function generateStaticParams() {
  return productParams;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/catalog/[product]">): Promise<Metadata> {
  const { locale, product: slug } = await params;
  const product = findProduct(slug);
  if (!product) return {};

  const t = await getTranslations({ locale, namespace: "product" });
  const tBrands = await getTranslations({ locale, namespace: "brands" });
  const tMaterials = await getTranslations({ locale, namespace: "materials" });

  // A template, not hand-written copy for six systems in four languages —
  // `project_plan/05-product-page.md` asks only for a "заготовка", and stage 08
  // owns titles, descriptions, canonicals and hreflang together.
  const values = {
    name: tBrands(`items.${slug}.name`),
    material: tMaterials(product.material),
    depth: product.depthMm,
  };

  return {
    title: t("metaTitle", values),
    description: t("metaDescription", values),
  };
}

/**
 * A profile system in full: gallery, characteristics, colours, applications,
 * advantages, the profile cutaway and the warranty.
 *
 * The order of the blocks follows the audiences of DESIGN.md §1, not the order
 * of the fields in the data. A flat owner gets the picture, the plain numbers
 * and the colours first; the cutaway — the "technical" image layer of §6 —
 * comes far enough down the page that it can never be the first thing anyone
 * sees, which §11 forbids outright, and it is the one dark block on the page
 * because a dark ground marks the change of audience to architects and dealers
 * (§3 п.2).
 *
 * Two things every block has to survive, because two of the six systems fail
 * them: the aluminium pair has no logo (`BrandMark` sets in type instead), and
 * ЭКОЛАЙН has no renders at all, so the gallery, the cutaway block and the card
 * image all have to degrade rather than break.
 */
export default async function ProductPage({ params }: PageProps<"/[locale]/catalog/[product]">) {
  const { locale, product: slug } = await params;
  const product = findProduct(slug);
  if (!product) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "product" });
  const tProducts = await getTranslations({ locale, namespace: "products" });
  const tBrands = await getTranslations({ locale, namespace: "brands" });
  const tCatalog = await getTranslations({ locale, namespace: "catalog" });
  const tMaterials = await getTranslations({ locale, namespace: "materials" });
  const tMaterialNotes = await getTranslations({ locale, namespace: "materialNotes" });
  const tSegments = await getTranslations({ locale, namespace: "segments" });

  const name = tBrands(`items.${slug}.name`);
  const specs = tProducts.raw(`items.${slug}.specs`) as Spec[];
  const productCategories = categoriesOfProduct(product);

  const materialLabel = [
    tMaterials(product.material),
    ...(product.materialNote ? [tMaterialNotes(product.materialNote)] : []),
  ].join(" · ");

  const facts = [
    { label: t("facts.depth"), value: tBrands("depth", { value: product.depthMm }) },
    { label: t("facts.chambers"), value: String(product.chambers) },
    { label: t("facts.colors"), value: String(product.colors.length) },
  ];

  return (
    <>
      <Section>
        <Container>
          <Breadcrumbs
            // Каталог → система. There is no category crumb: a system is in
            // several categories at once, so no single one of them is "the"
            // parent, and the URL says the same.
            items={[{ label: tCatalog("breadcrumb"), href: "/catalog" }, { label: name }]}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
            <ProductGallery
              name={name}
              gallery={product.gallery}
              placeholder={t("imagePlaceholder", { name })}
            />

            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Logo where one exists, typography where none does. The two
                    aluminium systems have no mark, and DESIGN.md §7 requires
                    the layout to work identically either way. */}
                <BrandMark logo={product.logo} name={name} className="h-10" />
                <Badge variant={segmentBadge[product.segment]}>{tSegments(product.segment)}</Badge>
              </div>

              <p className="mt-6 text-xs font-semibold tracking-[0.14em] text-brand-black/50 uppercase">
                {t("eyebrow")} · {materialLabel}
              </p>

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
                {tProducts(`items.${slug}.heading`)}
              </h1>

              <p className="mt-5 text-base leading-7 text-brand-black/65">
                {tProducts(`items.${slug}.description`)}
              </p>

              <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-brand-black/8 py-6">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-xs leading-5 text-brand-black/55">{fact.label}</dt>
                    <dd className="mt-1 font-heading text-xl font-bold text-brand-black">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={CALCULATOR_HREF} size="lg">
                  {t("cta.calculator")}
                </ButtonLink>
                <ButtonLink href={LEAD_FORM_ANCHOR} variant="outline" size="lg">
                  {t("cta.call")}
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <Reveal>
                <SectionHeading
                  eyebrow={t("specs.eyebrow")}
                  title={t("specs.title")}
                  description={t("specs.description")}
                />
              </Reveal>
              <div className="mt-8">
                <SpecTable specs={specs} />
              </div>
            </div>

            <div>
              <Reveal>
                <SectionHeading
                  eyebrow={t("colors.eyebrow")}
                  title={t("colors.title")}
                  description={t("colors.description")}
                />
              </Reveal>
              <div className="mt-8">
                <ColorSwatches colors={product.colors} />
              </div>
              {/* ЭКОЛАЙН, and only ЭКОЛАЙН: the brief says «ТОЛЬКО БЕЛЫЙ» and
                  its warranty is written against the white profile. A single
                  swatch with no explanation reads as missing data. */}
              {product.colors.length === 1 ? (
                <p className="mt-6 text-sm leading-6 text-brand-black/60">{t("colors.single")}</p>
              ) : null}
            </div>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow={t("applications.eyebrow")}
              title={t("applications.title")}
              description={t("applications.description")}
            />
          </Reveal>

          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {productCategories.map((category) => (
              <RevealItem key={category.slug} className="h-full">
                <CategoryCard category={category} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <Section tone="muted">
        <Container>
          <Reveal>
            <SectionHeading eyebrow={t("advantages.eyebrow")} title={t("advantages.title")} />
          </Reveal>

          <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {advantageKeys[product.material].map((key) => (
              <RevealItem key={key} className="h-full">
                <div className="h-full rounded-card border border-brand-black/10 bg-surface p-6">
                  <h3 className="font-heading text-lg font-semibold text-brand-black">
                    {t(`advantages.${product.material}.${key}.title`)}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-brand-black/70">
                    {t(`advantages.${product.material}.${key}.description`)}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      {/* The technical layer. Dark ground, because the audience changes here
          from the flat owner to the architect and the dealer — the only reason
          DESIGN.md §3 п.2 allows a dark section at all. Skipped entirely for
          the aluminium systems and ЭКОЛАЙН, which have no cutaway render. */}
      {product.sections.length > 0 ? (
        <Section tone="inverse">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
              <Reveal>
                <SectionHeading
                  eyebrow={t("section.eyebrow")}
                  title={t("section.title")}
                  description={t("section.description")}
                  tone="dark"
                />
              </Reveal>

              <div className="grid gap-4 sm:grid-cols-2">
                {product.sections.map((src, index) => (
                  <div
                    key={src}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-card bg-brand-white/5",
                      // ROLLER has three cutaways, STELLA and UNOPEN two. An
                      // odd count would leave the last cell of a two-column
                      // grid empty, so the lead render takes the full width
                      // and the rest pair off underneath it.
                      index === 0 && product.sections.length % 2 === 1 && "sm:col-span-2",
                    )}
                  >
                    <Image
                      src={src}
                      // Only the lead cutaway is described. The others are the
                      // same profile from another angle, and repeating the alt
                      // three times makes a screen reader read the section
                      // three times over.
                      alt={index === 0 ? t("section.imageAlt", { name }) : ""}
                      fill
                      className="object-contain p-6"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                      // Below the fold on every viewport: never preloaded, and
                      // the source PNGs are 3000x3000 (DESIGN.md §6 п.4).
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* Warranty. The brief's §7.5 legal text is written against ROLLER's PVC
          profiles and says so in its first sentence, so it is shown for the PVC
          systems only; the aluminium pair carries its term in the spec table
          above and nothing is invented to fill the gap. */}
      {product.material === "pvc" ? (
        <Section>
          <Container>
            <Reveal className="max-w-3xl">
              <SectionHeading eyebrow={t("warranty.eyebrow")} title={t("warranty.title")} />
              <p className="mt-4 text-sm leading-6 text-brand-black/55">{t("warranty.scope")}</p>
            </Reveal>

            <dl className="mt-10 grid gap-4 sm:grid-cols-3 lg:gap-5">
              {(["covered", "excluded", "conditions"] as const).map((key) => (
                <div
                  key={key}
                  className="rounded-card border border-brand-black/10 bg-surface-muted p-6"
                >
                  <dt className="font-heading text-base font-semibold text-brand-black">
                    {t(`warranty.${key}Title`)}
                  </dt>
                  <dd className="mt-3 text-sm leading-6 text-brand-black/70">
                    {t(`warranty.${key}`)}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-8">
              <a
                href={LEAD_FORM_ANCHOR}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                {t("cta.call")}
                <ArrowUpRight className="size-4 shrink-0" />
              </a>
            </p>
          </Container>
        </Section>
      ) : null}

      <RelatedProducts product={product} chooseHref={CALCULATOR_HREF} />

      <ContactsLeadSection />
    </>
  );
}
