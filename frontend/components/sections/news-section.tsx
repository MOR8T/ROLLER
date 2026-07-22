import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { newsTeasers } from "@/data/home";
import type { NewsTeaser } from "@/types";

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatNewsDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return dateFormatter.format(parsed);
}

function FeaturedNews({ article }: { article: NewsTeaser }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-brand-black text-brand-white">
      <Link
        href={article.href}
        className="relative block aspect-4/5 overflow-hidden p-8 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none sm:aspect-square sm:p-10 lg:aspect-4/5"
        aria-label={article.title}
      >
        <div className="relative h-full w-full">
          <MediaFrame
            src={article.image}
            alt={article.title}
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
            className="transition-colors hover:text-brand-white/90 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
          >
            {article.title}
          </Link>
        </h3>
        <p className="mt-3 max-w-lg text-sm leading-6 text-brand-white/65 sm:text-base sm:leading-7">
          {article.excerpt}
        </p>
        <Link
          href={article.href}
          className="mt-6 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-white transition-colors group-hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
        >
          Читать статью
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

function NewsRow({ article }: { article: NewsTeaser }) {
  return (
    <article className="group grid gap-4 border-b border-brand-black/10 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:py-6">
      <Link
        href={article.href}
        className="relative block aspect-square overflow-hidden rounded-2xl bg-brand-black p-3 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={article.title}
      >
        <div className="relative h-full w-full">
          <MediaFrame
            src={article.image}
            alt={article.title}
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
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-brand-black/65">{article.excerpt}</p>
        <Link
          href={article.href}
          className="mt-4 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Читать
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

export function NewsSection() {
  const [featured, ...rest] = newsTeasers;

  return (
    <Section id="news" className="bg-brand-white">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Новости и статьи"
            title="Короткие заметки о производстве, проектах и сервисе"
          />

          <Link
            href="/news"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-black px-5 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Все новости
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <Reveal preset="stagger" className="mt-10">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            <RevealItem className="lg:col-span-6 xl:col-span-7">
              <FeaturedNews article={featured} />
            </RevealItem>

            <RevealItem className="lg:col-span-6 xl:col-span-5">
              <div className="flex h-full flex-col justify-center lg:pl-2">
                <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-brand-black/40 uppercase">
                  Ещё материалы
                </p>
                <div>
                  {rest.map((article) => (
                    <NewsRow key={article.id} article={article} />
                  ))}
                </div>
              </div>
            </RevealItem>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
