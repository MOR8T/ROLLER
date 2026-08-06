import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { Link } from "@/i18n/navigation";
import { productCategories } from "@/data/home";

/**
 * Not on the homepage. "ПВХ or aluminium?" is a manufacturer's question, so
 * this moved inside the catalog where the split is URL structure rather than a
 * visitor's first choice (DESIGN.md §7). Wired up in stage 04.
 */
export function CategoriesSection() {
  const t = useTranslations("categories");
  const tCommon = useTranslations("common");

  return (
    <Section id="categories">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <Link
            href="/catalog"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-control border border-brand-black/15 px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-red hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {tCommon("allCatalog")}
            <ArrowUpRight className="size-4 shrink-0" />
          </Link>
        </div>

        <RevealGroup className="mt-10 grid gap-5 sm:gap-6 lg:grid-cols-2">
          {productCategories.map((category) => {
            const title = t(`items.${category.key}.title`);

            return (
              <RevealItem key={category.key}>
                <Link
                  href={category.href}
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
                        {t(`items.${category.key}.eyebrow`)}
                      </span>
                      <ArrowUpRight className="size-7 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-8" />
                    </div>
                    <div>
                      <p className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
                        {title}
                      </p>
                      <p className="mt-3 max-w-md text-sm leading-6 text-brand-black/70 sm:text-base sm:leading-7">
                        {t(`items.${category.key}.description`)}
                      </p>
                      <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-black">
                        {t("viewCategory")}
                        <ArrowUpRight className="size-4 shrink-0 text-brand-red transition-transform duration-300 group-hover:translate-x-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
