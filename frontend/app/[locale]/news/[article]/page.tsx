import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ArticleCard } from "@/components/news/article-card";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { articleParams, findArticleBySlug, otherArticles } from "@/data/news";

export function generateStaticParams() {
  return articleParams;
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/news/[article]">): Promise<Metadata> {
  const { locale, article: slug } = await params;
  const article = findArticleBySlug(slug);
  if (!article) return {};

  const t = await getTranslations({ locale, namespace: "news" });

  return {
    title: t(`items.${article.id}.title`),
    description: t(`items.${article.id}.excerpt`),
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/news/[article]">) {
  const { locale, article: slug } = await params;
  const article = findArticleBySlug(slug);
  if (!article) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "news" });
  const tPage = await getTranslations({ locale, namespace: "newsPage" });
  const format = await getFormatter({ locale });

  const title = t(`items.${article.id}.title`);
  const body = t.raw(`items.${article.id}.body`) as string[];
  const others = otherArticles(article);
  const date = format.dateTime(new Date(article.date), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Section>
        <Container>
          <Breadcrumbs items={[{ label: tPage("breadcrumb"), href: "/news" }, { label: title }]} />

          <Reveal className="mt-8 max-w-3xl">
            <time
              dateTime={article.date}
              className="text-xs font-semibold tracking-[0.18em] text-brand-red uppercase"
            >
              {date}
            </time>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
              {title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-brand-black/65">
              {t(`items.${article.id}.excerpt`)}
            </p>
          </Reveal>

          <div className="mt-10">
            <MediaFrame
              src={article.cover}
              alt={title}
              width={1440}
              height={720}
              objectFit="contain"
              sizes="100vw"
              containerClassName="bg-surface-muted"
              className="p-8"
            />
          </div>

          <div className="mt-10 max-w-3xl space-y-5 text-base leading-7 text-brand-black/75">
            {body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Container>
      </Section>

      {others.length > 0 ? (
        <Section tone="muted">
          <Container>
            <Reveal>
              <SectionHeading eyebrow={t("eyebrow")} title={t("moreMaterials")} />
            </Reveal>

            <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {others.map((other) => (
                <RevealItem key={other.slug} className="h-full">
                  <ArticleCard article={other} />
                </RevealItem>
              ))}
            </RevealGroup>
          </Container>
        </Section>
      ) : null}

      <ContactsLeadSection />
    </>
  );
}
