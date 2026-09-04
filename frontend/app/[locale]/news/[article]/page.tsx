import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";

import { Breadcrumbs } from "@/components/products/breadcrumbs";
import { ArticleCard } from "@/components/news/article-card";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { articleHref, fetchArticle, fetchLatestNews, newsParams } from "@/lib/news";
import { buildPageMetadata } from "@/lib/page-metadata";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "@/lib/json-ld";
import { JsonLd } from "@/components/seo/json-ld";

export async function generateStaticParams() {
  return newsParams();
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/news/[article]">): Promise<Metadata> {
  const { locale, article: slug } = await params;
  const article = await fetchArticle(locale, slug);
  if (!article) return {};

  // No `pageKey`: an article's title and description are its own content, and
  // it has no row in `SEO_PAGE_PATHS` — the key only exists for the six static
  // pages, which are the ones with a fixed address to canonicalise.
  return buildPageMetadata({
    locale,
    path: articleHref(slug),
    title: article.title,
    description: article.excerpt,
    image: article.cover,
    type: "article",
    publishedTime: article.publishedAt,
  });
}

/**
 * One article. Header, cover, body, then the three newest other entries.
 *
 * The cover is a full-bleed photograph rather than the `MediaFrame` render on
 * grey it used to be — same change as on the cards, and for the same reason
 * (see `ArticleCard`). The body arrives as paragraphs from `lib/news.ts`; when
 * the admin panel ships rich text, this map is what changes.
 */
export default async function ArticlePage({ params }: PageProps<"/[locale]/news/[article]">) {
  const { locale, article: slug } = await params;
  const article = await fetchArticle(locale, slug);
  if (!article) notFound();
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "news" });
  const tPage = await getTranslations({ locale, namespace: "newsPage" });
  const format = await getFormatter({ locale });

  const others = await fetchLatestNews(locale, 3, article.slug);
  const date = format.dateTime(new Date(article.publishedAt), {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // The graphs mirror what the page shows: the breadcrumb trail rendered two
  // lines below, and the article itself. `buildArticleJsonLd` points `author`
  // and `publisher` at the organisation node the root layout already emitted
  // rather than restating the company on every article.
  const [articleJsonLd, breadcrumbJsonLd] = await Promise.all([
    buildArticleJsonLd({
      locale,
      path: articleHref(article.slug),
      headline: article.title,
      description: article.excerpt,
      image: article.cover,
      publishedAt: article.publishedAt,
    }),
    buildBreadcrumbJsonLd(locale, [
      { name: tPage("breadcrumb"), path: "/news" },
      { name: article.title },
    ]),
  ]);

  return (
    <>
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd]} />
      <Section className="pt-12!">
        <Container>
          <Breadcrumbs
            items={[{ label: tPage("breadcrumb"), href: "/news" }, { label: article.title }]}
          />

          <Reveal className="mt-8 max-w-3xl">
            <time
              dateTime={article.publishedAt}
              className="text-xs font-semibold tracking-[0.18em] text-brand-red uppercase"
            >
              {date}
            </time>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-brand-black/65">{article.excerpt}</p>
          </Reveal>

          <div className="relative mt-10 aspect-16/9 overflow-hidden rounded-card bg-neutral-100">
            <Image
              src={article.cover}
              alt=""
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              className="object-cover"
            />
          </div>

          {/* `body` is Tiptap's own HTML, authored in the admin panel — not
              user input — and `.rich-text` (app/globals.css) is the same
              class the editor itself renders with, so the two match. */}
          <div
            className="rich-text mt-10 max-w-3xl text-base leading-7 text-brand-black/75"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />
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
