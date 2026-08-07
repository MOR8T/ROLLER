import { useFormatter, useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { MediaFrame } from "@/components/ui/media-frame";
import { Link } from "@/i18n/navigation";
import { articleHref, type ArticleRecord } from "@/data/news";

/**
 * An article in the news grid: cover, date, title, excerpt.
 *
 * The date goes through `next-intl`'s formatter, not a module-scope
 * `Intl.DateTimeFormat("ru-RU")` — that mistake printed "12 мая 2026" on the
 * Turkish site and was already fixed once in `NewsSection`.
 */
export function ArticleCard({ article }: { article: ArticleRecord }) {
  const t = useTranslations("news");
  const format = useFormatter();

  const title = t(`items.${article.id}.title`);
  const parsed = new Date(article.date);
  const date = Number.isNaN(parsed.getTime())
    ? article.date
    : format.dateTime(parsed, { day: "numeric", month: "long", year: "numeric" });

  return (
    <article className="group h-full">
      <Link
        href={articleHref(article.slug)}
        className="flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/30 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <MediaFrame
          src={article.cover}
          alt={title}
          width={800}
          height={520}
          objectFit="contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          containerClassName="rounded-none border-0 bg-surface-muted"
          className="p-6 transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <time
            dateTime={article.date}
            className="text-xs font-semibold tracking-[0.18em] text-brand-red uppercase"
          >
            {date}
          </time>

          <h3 className="mt-3 font-heading text-xl font-bold tracking-tight text-brand-black">
            {title}
          </h3>

          <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/65">
            {t(`items.${article.id}.excerpt`)}
          </p>

          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
            {t("read")}
            <ArrowUpRight className="size-4 shrink-0" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}
