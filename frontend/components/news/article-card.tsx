import Image from "next/image";
import { useFormatter } from "next-intl";

import { Link } from "@/i18n/navigation";
import { articleHref, type NewsArticle } from "@/lib/news";
import { cn } from "@/lib/utils";

/**
 * An article in the news grid: a photograph, and under it a black panel with
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
 *   • **The panel is `brand-black`, not white.** It is the one solid dark
 *     element on a light page, and it is what makes a row of covers read as
 *     cards rather than as a contact sheet. The photographs are the client's
 *     own and are light and busy; white text on black is the only pairing that
 *     stays readable across all fifteen of them.
 *
 *   • **`object-cover`, not `contain` on grey.** The covers stopped being
 *     product renders in the 2026-08-13 pass — see the note on the feed in
 *     `data/news/ru.json` — and a photograph is cropped, not floated.
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
        className="flex h-full flex-col overflow-hidden rounded-card bg-brand-black focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <div className="relative aspect-5/3 overflow-hidden bg-neutral-100">
          <Image
            src={article.cover}
            alt=""
            fill
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
            priority={priority}
            // Admin-uploaded covers are absolute URLs into the backend; the
            // optimizer runs server-side and can't reach that URL from
            // inside a Docker container — see `HeroSection`'s own note.
            unoptimized={article.cover.startsWith("http")}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        <div className="flex flex-1 flex-col justify-end p-5 sm:p-6">
          <time
            dateTime={article.publishedAt}
            className="text-xs font-semibold tracking-[0.18em] text-brand-white/55 uppercase transition-colors group-hover:text-brand-red"
          >
            {date}
          </time>

          <h3 className="mt-3 font-heading text-lg leading-snug font-bold tracking-tight text-brand-white sm:text-xl">
            {article.title}
          </h3>
        </div>
      </Link>
    </article>
  );
}
