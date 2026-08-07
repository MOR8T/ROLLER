import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { MediaFrame } from "@/components/ui/media-frame";
import { Link } from "@/i18n/navigation";
import { categoryHref, type CategoryBase } from "@/data/catalog";

/**
 * A material as an entry point: the large tile used at the top of `/catalog`.
 *
 * Deliberately not on the homepage. "PVC or aluminium?" is a manufacturer's
 * question and a flat owner cannot answer it (DESIGN.md §7) — inside the
 * catalog the split is URL structure the visitor has already chosen to browse,
 * which is a different job.
 */
export function CategoryCard({ category }: { category: CategoryBase }) {
  const t = useTranslations("categories");
  const title = t(`items.${category.slug}.title`);

  return (
    <Link
      href={categoryHref(category.slug)}
      className="group relative block min-h-80 overflow-hidden rounded-card border border-brand-black/8 bg-neutral-50 text-brand-black transition-colors duration-300 hover:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="absolute inset-0">
        <MediaFrame
          src={category.image}
          alt={title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          containerClassName="bg-neutral-50"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,247,247,0.1)_0%,rgba(247,247,247,0.55)_50%,rgba(247,247,247,0.95)_100%)]" />
      <div className="relative flex min-h-80 flex-col justify-between gap-6 p-6 sm:p-8 lg:p-10">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-control border border-brand-black/12 bg-brand-white/70 px-3 py-1.5 text-xs font-medium tracking-[0.18em] text-brand-black/80 uppercase backdrop-blur-md">
            <span className={`size-2 shrink-0 rounded-full ${category.accent}`} />
            {t(`items.${category.slug}.eyebrow`)}
          </span>
          <ArrowUpRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-8" />
        </div>
        <div>
          <p className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-brand-black/70 sm:text-base sm:leading-7">
            {t(`items.${category.slug}.description`)}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-black">
            {t("viewCategory")}
            <ArrowUpRight className="size-4 shrink-0 text-brand-red transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
