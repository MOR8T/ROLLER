import Image from "next/image";
import { useFormatter } from "next-intl";

import { Link } from "@/i18n/navigation";
import { articleHref, type NewsArticle } from "@/lib/news";
import { cn } from "@/lib/utils";

/**
 * An article in the news grid: a photograph, and under it a light panel with
 * the date and the headline.
 *
 * ⚠️ Rebuilt on 2026-08-17 against imzo.uz/news at the client's request. What
 * changed and why:
 *
 *   • **The excerpt is gone.** imzo's card carries a date and a headline and
 *     nothing else, and the excerpt was the thing that made three of these read
 *     as a wall of text. It survives on the article page and in the page
 *     `<meta description>`, which is where it does work.
 *
 *   • **`object-cover`, not `contain` on grey.** The covers stopped being
 *     product renders in the 2026-08-13 pass — see the note on the feed in
 *     `data/news/ru.json` — and a photograph is cropped, not floated.
 *
 * ⚠️ The panel was `brand-black` until 2026-09-06 — a solid dark block was the
 * one thing on `/news` that read as belonging to another site, so it is now the
 * same light card the rest of the site uses (`ProductCard`, the calculator, the
 * showroom): `bg-surface`, a `brand-black/10` hairline that fills red on hover,
 * black headline, muted date. `border`, not `shadow`, because on `/news` the
 * card sits on white and needs an edge, and in the article page's related strip
 * it sits on `surface-muted` and the same edge still holds.
 *
 * The date goes through `next-intl`'s formatter, not a module-scope
 * `Intl.DateTimeFormat("ru-RU")` — that mistake printed "12 мая 2026" on the
 * Turkish site and was already fixed once in `NewsSection`.
 */
export function ArticleCard({
  article,
  className,
  priority = false,
}: {
  article: NewsArticle;
  className?: string;
  /** Set on the first row only — those covers are above the fold on `/news`. */
  priority?: boolean;
}) {
  const format = useFormatter();

  const parsed = new Date(article.publishedAt);
  const date = Number.isNaN(parsed.getTime())
    ? article.publishedAt
    : format.dateTime(parsed, { day: "numeric", month: "long", year: "numeric" });

  return (
    <article className={cn("group h-full", className)}>
      <Link
        href={articleHref(article.slug)}
        className="flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none active:border-brand-red/40"
      >
        <div className="relative aspect-5/3 overflow-hidden bg-surface-muted">
          <Image
            src={article.cover}
            alt=""
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            priority={priority}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col justify-end p-5 sm:p-6">
          <time
            dateTime={article.publishedAt}
            className="text-xs font-semibold tracking-[0.18em] text-brand-black/50 uppercase transition-colors group-hover:text-brand-red group-active:text-brand-red"
          >
            {date}
          </time>

          <h3 className="mt-3 font-heading text-lg leading-snug font-bold tracking-tight text-brand-black sm:text-xl">
            {article.title}
          </h3>
        </div>
      </Link>
    </article>
  );
}
