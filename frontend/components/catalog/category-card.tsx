import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { MediaFrame } from "@/components/ui/media-frame";
import { Link } from "@/i18n/navigation";
import { categoryHref, type CategoryBase } from "@/data/catalog";

/**
 * A category as an entry point — the card on the homepage, on `/catalog` and on
 * a product page, linking to the landing at `/solutions/[slug]`.
 *
 * ⚠️ This was `ApplicationCard` until 2026-08-17, and the name it took over
 * belonged to a very different tile: a full-bleed «ПВХ / Алюминий» panel that
 * asked the visitor to pick a material. The client removed that split, so the
 * component went with it and the card that answers "what do you need?" is the
 * only one left.
 *
 * The image slot is a nullable data field, not a hardcoded path: context-layer
 * photography does not exist yet and arrives through the admin panel without a
 * code change (DESIGN.md §6 п.2). Until then `MediaFrame` renders its neutral
 * placeholder.
 */
export function CategoryCard({ category }: { category: CategoryBase }) {
  const t = useTranslations("categories");
  const title = t(`items.${category.slug}.title`);

  return (
    <Link
      href={categoryHref(category.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <MediaFrame
        src={category.image}
        alt={title}
        // The title is interpolated as written. It used to be lowercased in
        // code, which is unsafe once Turkish is in scope: `toLowerCase()` turns
        // "İ" into "i̇" and "I" into "i" rather than "ı".
        placeholderLabel={t("imagePlaceholder", { title })}
        width={420}
        height={300}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        containerClassName="rounded-none border-0"
      />

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-xl font-semibold text-brand-black">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/70">
          {t(`items.${category.slug}.description`)}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
          {t("cta")}
          <ArrowUpRight className="size-4 shrink-0" />
        </span>
      </div>
    </Link>
  );
}
