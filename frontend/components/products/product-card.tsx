import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { BrandMark } from "@/components/products/brand-mark";
import { Badge } from "@/components/ui/badge";
import { MediaFrame } from "@/components/ui/media-frame";
import { Link } from "@/i18n/navigation";
import { productHref, type ProductBase } from "@/data/products";
import { isExternalHref } from "@/lib/utils";
import type { ProductCardBadgeVariant, Segment, Spec } from "@/types";

const chooseClasses =
  "inline-flex items-center text-sm font-semibold text-brand-red transition-colors hover:text-brand-red/80 focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none";

/**
 * The catalog card for a profile system. Used by `/catalog` and by the category
 * landings, so a system reads the same wherever it is listed.
 *
 * Contents are fixed by `project_plan/04-catalog-and-applications.md`: render,
 * name, brand logo where one exists, segment, material, two or three key
 * characteristics, "Подробнее" and a "Подобрать" CTA. No price anywhere — the
 * site does not show them, and the CTA is the whole answer to "сколько стоит".
 */

// Red stays an accent rather than a coding system: only the premium rung is
// marked in brand red, which keeps the badges inside the ~5% budget of
// DESIGN.md §3.
const segmentBadge: Record<Segment, ProductCardBadgeVariant> = {
  economy: "outline",
  mid: "outline",
  "upper-mid": "black",
  premium: "red",
};

interface ProductCardProps {
  product: ProductBase;
  /**
   * Target for the "Подобрать" CTA — `/calculator` since stage 06, which is
   * where the plan puts the calculator CTA ("на карточках систем и на
   * странице товара"). A page-local fragment is still accepted.
   */
  chooseHref: string;
  sizes?: string;
}

export function ProductCard({ product, chooseHref, sizes }: ProductCardProps) {
  const t = useTranslations("products");
  const tBrands = useTranslations("brands");
  const tMaterials = useTranslations("materials");
  const tMaterialNotes = useTranslations("materialNotes");
  const tSegments = useTranslations("segments");

  const name = tBrands(`items.${product.slug}.name`);
  const segment = tSegments(product.segment);
  const href = productHref(product);

  // Two or three pairs off the front of the flexible spec list — never a fixed
  // set of columns. A component (a net, a windowsill) declares different pairs
  // entirely, and this card renders whatever it is given.
  const specs = (t.raw(`items.${product.slug}.specs`) as Spec[]).slice(0, 3);

  const materialLabel = [
    tMaterials(product.material),
    ...(product.materialNote ? [tMaterialNotes(product.materialNote)] : []),
  ].join(" · ");

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40">
      <Link
        href={href}
        aria-label={t("cardAria", { name, segment })}
        className="relative block bg-surface-muted p-6 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <MediaFrame
          src={product.images[0] ?? null}
          alt={t("imageAlt", { name })}
          placeholderLabel={t("imagePlaceholder", { name })}
          width={480}
          height={320}
          objectFit="contain"
          sizes={sizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
          containerClassName="border-0 bg-transparent"
          className="transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col border-t border-brand-black/8 p-6">
        {/* `flex-wrap`: the segment label is one short word in Russian
            ("премиум") and three in Tajik ("болотар аз миёна"). */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <BrandMark logo={product.logo} name={name} />
          <Badge variant={segmentBadge[product.segment]}>{segment}</Badge>
        </div>

        <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-brand-black/50 uppercase">
          {materialLabel}
        </p>

        <p className="mt-3 text-sm leading-6 text-brand-black/70">
          {tBrands(`items.${product.slug}.audience`)}
        </p>

        <dl className="mt-5 flex-1 space-y-2 border-t border-brand-black/8 pt-5 text-sm leading-6">
          {specs.map((spec) => (
            <div key={spec.name} className="flex items-baseline justify-between gap-4">
              <dt className="text-brand-black/55">{spec.name}</dt>
              <dd className="text-right font-semibold text-brand-black">{spec.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:rounded-control focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t("more")}
            <ArrowUpRight className="size-4 shrink-0" />
          </Link>
          {/* A route (`/calculator`) goes through the locale-aware `Link`; a
              same-page fragment stays on a plain `<a>`, where a locale prefix
              would turn the scroll into a navigation. */}
          {isExternalHref(chooseHref) ? (
            <a href={chooseHref} className={chooseClasses}>
              {t("choose")}
            </a>
          ) : (
            <Link href={chooseHref} className={chooseClasses}>
              {t("choose")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
