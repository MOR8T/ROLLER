import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { Card } from "@/components/ui/card";
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

function NewsCard({ article, sizes }: { article: NewsTeaser; sizes: string }) {
  return (
    <Card
      variant="elevated"
      className="group flex h-full flex-col overflow-hidden rounded-4xl border border-brand-black/10 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-black/10"
    >
      <Link
        href={article.href}
        className="relative block aspect-16/10 bg-brand-black focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={article.title}
      >
        <MediaFrame
          src={article.image}
          alt={article.title}
          fill
          sizes={sizes}
          containerClassName="h-full w-full bg-brand-black"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-brand-black/55 to-transparent" />
        <time
          dateTime={article.date}
          className="absolute bottom-3 left-3 rounded-full bg-brand-white/95 px-3 py-1 text-xs font-semibold text-brand-black shadow-sm backdrop-blur"
        >
          {formatNewsDate(article.date)}
        </time>
      </Link>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-heading text-xl font-bold tracking-tight text-brand-black sm:text-2xl">
          {article.title}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/68">{article.excerpt}</p>

        <Link
          href={article.href}
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-md py-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Читать статью
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Card>
  );
}

export function NewsSection() {
  return (
    <Section id="news" className="bg-brand-white">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Новости и статьи"
            title="Короткие заметки о производстве, проектах и сервисе"
            // description="Показываем, что происходит на производстве и каких объектов мы касаемся — это помогает понять подход и культуру работы."
          />

          <div className="flex flex-col items-start gap-3 lg:items-end">
            {/* <p className="max-w-sm text-sm leading-6 text-brand-black/62">
              Пока это подборка свежих заметок. Полный раздел статей и новостей с фильтрами будет
              доступен на отдельной странице.
            </p> */}
            <Link
              href="/news"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-black px-5 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Все новости
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <Reveal preset="stagger" className="mt-10">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {newsTeasers.map((article) => (
              <RevealItem key={article.id}>
                <NewsCard
                  article={article}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
              </RevealItem>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
