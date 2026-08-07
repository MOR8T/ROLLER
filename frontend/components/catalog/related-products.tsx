import { useTranslations } from "next-intl";

import { ProductGrid } from "@/components/catalog/product-grid";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { relatedProducts, type ProductBase } from "@/data/catalog";

/**
 * "Другие системы" — the same-material neighbours of the system on screen,
 * nearest rung of the segment ladder first (`relatedProducts`).
 *
 * Reuses `ProductGrid`, so a system reads identically here and in the catalog.
 * No `empty` fallback is possible from this page: every category holds at least
 * two systems, and the section is skipped outright below if that ever stops
 * being true rather than rendering an empty-state panel a visitor would read as
 * "we make nothing else".
 */
export function RelatedProducts({
  product,
  chooseHref,
}: {
  product: ProductBase;
  chooseHref: string;
}) {
  const t = useTranslations("product.related");
  const items = relatedProducts(product);

  if (items.length === 0) return null;

  return (
    <Section tone="muted">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("title")}
            description={t("description")}
          />
        </Reveal>

        <ProductGrid
          className="mt-10"
          products={items}
          chooseHref={chooseHref}
          // Unreachable — guarded above. `ProductGrid` requires the prop so
          // that no caller can ship a silently empty grid.
          empty={null}
        />
      </Container>
    </Section>
  );
}
