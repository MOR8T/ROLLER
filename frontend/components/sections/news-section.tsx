import Image from "next/image";
import { useFormatter } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";

import { HomeCarousel } from "@/components/sections/home-carousel";
import { HomeHeading, HomeSection, homeCard } from "@/components/sections/home-kit";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { articleHref, fetchLatestNews, type NewsArticle } from "@/lib/news";

/**
 * "Новости" — a photograph, a date and a headline, on a strip that loops and
 * plays itself.
 *
 * The excerpt and the «Читать» link are gone. What the homepage needs from this
 * block is the date: it is the only thing on the page that proves the company
 * is still there. The headline earns the click, and `/news` carries the rest
 * for anyone comparing several at once.
 *
 * The covers are the client's own photographs rather than the catalogue renders
 * they used to be — see the note on the feed in `data/news/ru.json`.
 *
 * Six slides, not the whole feed: the list can run to many entries and is paged
 * on `/news`, and a carousel that never comes back round is a scroll trap. Six
 * is two loops of three on desktop.
 *
 * ⚠️ News moved from a static fixture to the admin panel on 2026-08-24
 * (`lib/news.ts` fetches it; managed from `app/admin/(dashboard)/news/page.tsx`).
 * `fetchLatestNews` returns `[]`, never fabricated content, when the backend
 * has nothing yet — `NewsSkeleton` below renders instead, same shape as
 * `HeroSection`'s and `PartnersSection`'s own skeletons.
 */
function NewsCard({ article }: { article: NewsArticle }) {
  const format = useFormatter();

  const parsed = new Date(article.publishedAt);
  const date = Number.isNaN(parsed.getTime())
    ? article.publishedAt
    : format.dateTime(parsed, { day: "numeric", month: "long", year: "numeric" });

  return (
    <Link
      href={articleHref(article.slug)}
      className="group block focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className={`relative aspect-4/3 overflow-hidden bg-neutral-100 ${homeCard}`}>
        <Image
          src={article.cover}
          alt=""
          fill
          sizes="(max-width: 640px) 86vw, (max-width: 1024px) 46vw, 31vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>

      {/* The one place red survives on the homepage besides the mark in the
          header: the date is the whole point of the block, so it gets the
          accent and everything around it stays black. */}
      <time
        dateTime={article.publishedAt}
        className="mt-6 block text-xs font-semibold tracking-[0.18em] text-brand-red uppercase"
      >
        {date}
      </time>
      <h3 className="mt-3 font-heading text-xl font-bold tracking-tight text-brand-black transition-colors group-hover:text-brand-black/55">
        {article.title}
      </h3>
    </Link>
  );
}

export async function NewsSection() {
  const t = await getTranslations("home.news");
  const locale = await getLocale();
  const articles = await fetchLatestNews(locale, 6);

  return (
    <HomeSection id="news" tone="muted">
      <Reveal>
        <HomeHeading title={t("title")} action={{ label: t("all"), href: "/news" }} />
      </Reveal>

      <Reveal className="mt-12">
        {articles.length === 0 ? (
          <NewsSkeleton />
        ) : (
          <HomeCarousel
            label={t("title")}
            perView={[1.15, 2, 3]}
            gap={24}
            // Slower than the logo strip: a headline has to be readable in one
            // pass, and eight marks do not.
            autoplayDelay={5000}
            slides={articles.map((article) => ({
              key: article.slug,
              node: <NewsCard article={article} />,
            }))}
          />
        )}
      </Reveal>
    </HomeSection>
  );
}

/**
 * Stands in for the carousel while there are no articles to show — same card
 * frame (photo, date line, headline) repeated three times, so the swap to
 * real content the moment the admin publishes a news item doesn't jolt the
 * layout. Pulses as one unit rather than per-piece, same treatment as
 * `HeroSection`'s and `PartnersSection`'s own skeletons.
 */
function NewsSkeleton() {
  return (
    <div className="animate-pulse" style={{ animationDuration: "3.2s" }}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <div className={`aspect-4/3 bg-brand-black/10 ${homeCard}`} />
            <div className="mt-6 h-3 w-24 rounded-control bg-brand-black/10" />
            <div className="mt-3 h-6 w-4/5 rounded-control bg-brand-black/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
