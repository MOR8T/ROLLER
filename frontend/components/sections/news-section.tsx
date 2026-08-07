import { useFormatter, useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { Link } from "@/i18n/navigation";
import { newsTeasers, type NewsTeaserBase } from "@/data/home";

/**
 * Date formatting runs through `next-intl` rather than a module-scope
 * `Intl.DateTimeFormat("ru-RU")`, which produced "12 мая 2026" on every locale
 * regardless of what the visitor was reading.
 */
function useNewsDate() {
  const format = useFormatter();

  return (isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return format.dateTime(parsed, { day: "numeric", month: "long", year: "numeric" });
  };
}

function FeaturedNews({ article }: { article: NewsTeaserBase }) {
  const t = useTranslations("news");
  const formatNewsDate = useNewsDate();
  const title = t(`items.${article.id}.title`);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/8 bg-neutral-50 text-brand-black">
      <Link
        href={article.href}
        className="relative block aspect-4/5 overflow-hidden p-8 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none sm:aspect-square sm:p-10 lg:aspect-4/5"
        aria-label={title}
      >
        <div className="relative h-full w-full">
          <MediaFrame
            src={article.image}
            alt={title}
            fill
            sizes="(max-width: 1024px) 100vw, 48vw"
            objectFit="contain"
            containerClassName="h-full w-full bg-transparent"
            className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="flex flex-1 flex-col justify-end p-6 sm:p-8">
        <time
          dateTime={article.date}
          className="text-xs font-semibold tracking-[0.2em] text-brand-red uppercase"
        >
          {formatNewsDate(article.date)}
        </time>
        <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
          <Link
            href={article.href}
            className="transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-brand-black/65 sm:text-base sm:leading-7">
          {t(`items.${article.id}.excerpt`)}
        </p>
        <Link
          href={article.href}
          className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white focus-visible:outline-none"
        >
          {t("readArticle")}
          <ArrowRight className="size-4 shrink-0" />
        </Link>
      </div>
    </article>
  );
}

function NewsRow({ article }: { article: NewsTeaserBase }) {
  const t = useTranslations("news");
  const formatNewsDate = useNewsDate();
  const title = t(`items.${article.id}.title`);

  return (
    <article className="group grid gap-4 border-b border-brand-black/10 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:py-6">
      <Link
        href={article.href}
        className="relative block aspect-square overflow-hidden rounded-card border border-brand-black/8 bg-neutral-50 p-3 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={title}
      >
        <div className="relative h-full w-full">
          <MediaFrame
            src={article.image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, 144px"
            objectFit="contain"
            containerClassName="h-full w-full bg-transparent"
            className="object-contain transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>
      </Link>

      <div className="flex min-w-0 flex-col justify-center">
        <time
          dateTime={article.date}
          className="text-xs font-semibold tracking-[0.18em] text-brand-red uppercase"
        >
          {formatNewsDate(article.date)}
        </time>
        <h3 className="mt-2 font-heading text-xl font-bold tracking-tight text-brand-black sm:text-2xl">
          <Link
            href={article.href}
            className="transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-black/65">
          {t(`items.${article.id}.excerpt`)}
        </p>
        <Link
          href={article.href}
          className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {t("read")}
          <ArrowUpRight className="size-4 shrink-0" />
        </Link>
      </div>
    </article>
  );
}

/**
 * Not on the homepage — the target composition in DESIGN.md §7 has no news
 * block. Kept for the /news page, stage 07.
 */
export function NewsSection() {
  const t = useTranslations("news");
  const [featured, ...rest] = newsTeasers;

  return (
    <Section id="news">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />

          <Link
            href="/news"
            className="inline-flex w-fit shrink-0 items-center gap-2 rounded-control bg-brand-black px-5 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {t("allNews")}
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </div>

        <RevealGroup className="mt-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            <RevealItem className="lg:col-span-6 xl:col-span-7">
              <FeaturedNews article={featured} />
            </RevealItem>

            <RevealItem className="lg:col-span-6 xl:col-span-5">
              <div className="flex h-full flex-col justify-center lg:pl-2">
                <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-brand-black/40 uppercase">
                  {t("moreMaterials")}
                </p>
                <div>
                  {rest.map((article) => (
                    <NewsRow key={article.id} article={article} />
                  ))}
                </div>
              </div>
            </RevealItem>
          </div>
        </RevealGroup>
      </Container>
    </Section>
  );
}
