import Image from "next/image";
import { useFormatter, useTranslations } from "next-intl";

import { HomeCarousel } from "@/components/sections/home-carousel";
import { HomeHeading, HomeSection, homeCard } from "@/components/sections/home-kit";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { articleHref, articles, type ArticleRecord } from "@/data/news";

/**
 * "Новости" — a photograph, a date and a headline, on a strip that loops and
 * plays itself.
 *
 * The excerpt and the «Читать» link are gone. What the homepage needs from this
 * block is the date: it is the only thing on the page that proves the company
 * is still there. The headline earns the click, and `/news` carries the summary
 * for anyone comparing several at once.
 *
 * The covers are the client's own photographs rather than the catalogue renders
 * they used to be — see the note on `articles` in `data/news.ts`.
 */
function useNewsDate() {
  const format = useFormatter();

  return (isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return format.dateTime(parsed, { day: "numeric", month: "long", year: "numeric" });
  };
}

function NewsCard({ article }: { article: ArticleRecord }) {
  const t = useTranslations("news");
  const formatNewsDate = useNewsDate();
  const title = t(`items.${article.id}.title`);

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
        dateTime={article.date}
        className="mt-6 block text-xs font-semibold tracking-[0.18em] text-brand-red uppercase"
      >
        {formatNewsDate(article.date)}
      </time>
      <h3 className="mt-3 font-heading text-xl font-bold tracking-tight text-brand-black transition-colors group-hover:text-brand-black/55">
        {title}
      </h3>
    </Link>
  );
}

export function NewsSection() {
  const t = useTranslations("home.news");

  return (
    <HomeSection id="news" tone="muted">
      <Reveal>
        <HomeHeading title={t("title")} action={{ label: t("all"), href: "/news" }} />
      </Reveal>

      <Reveal className="mt-12">
        <HomeCarousel
          label={t("title")}
          perView={[1.15, 2, 3]}
          gap={24}
          // Slower than the logo strip: a headline has to be readable in one
          // pass, and eight marks do not.
          autoplayDelay={5000}
          slides={articles.map((article) => ({
            key: article.id,
            node: <NewsCard article={article} />,
          }))}
        />
      </Reveal>
    </HomeSection>
  );
}
