import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { ArticleCard } from "@/components/news/article-card";
import { NewsPagination } from "@/components/news/news-pagination";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { Container } from "@/components/ui/container";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { fetchNewsPage } from "@/lib/news";
import { buildPageMetadata } from "@/lib/page-metadata";
import { SEO_PAGE_PATHS } from "@/lib/seo";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/news">): Promise<Metadata> {
  const { locale } = await params;
  const { page } = await searchParams;
  const t = await getTranslations({ locale, namespace: "newsPage" });
  const { page: current } = await fetchNewsPage(locale, page);

  return buildPageMetadata({
    locale,
    path: SEO_PAGE_PATHS.news,
    pageKey: "news",
    title:
      current > 1
        ? `${t("metaTitle")} — ${t("pagination.page", { page: current })}`
        : t("metaTitle"),
    description: t("metaDescription"),
    // Page 2+ is `noindex, follow`: the crawler still walks through to every
    // article, but the slice itself does not compete with `/news` for a result.
    //
    // ⚠️ Note what this does *not* do — it does not point page 2's canonical at
    // `/news`. `buildPageMetadata` canonicalises every page here to `/news`
    // already, because `path` carries no `?page=`, and that is the correct
    // shape: a `?page=2` canonical would be self-referential and a `/news`
    // canonical *plus* `noindex` would tell Google to drop `/news` too, since a
    // `noindex` on a page that claims another as canonical propagates. The
    // pairing that works is exactly this one — canonical at the list,
    // `noindex, follow` on the slice.
    noindex: current > 1,
  });
}

/**
 * `/news` — rebuilt on 2026-08-17 against imzo.uz/news at the client's request.
 * Three blocks, in their order:
 *
 *   header      the title and the one sentence under it.
 *   grid        twelve dated cards, three across, and the page numbers.
 *   contacts    the office contacts and the short request form.
 *
 * That is imzo's page exactly — it has no category filter, no search, no
 * sidebar and no featured article, and adding any of them would be inventing
 * a section the client did not ask for. What is ours rather than theirs: the
 * container and vertical rhythm, `rounded-card` instead of their 20px, the long
 * per-locale date instead of `06.07.2026`, and the site's own light card in
 * place of the accent colour they use — see `ArticleCard`, whose panel was
 * black until 2026-09-06.
 *
 * ⚠️ What this replaced: the same grid rendering all three mock articles with
 * excerpts, on white cards with a «Читать» link. The excerpt and the link are
 * gone with the card redesign (see `ArticleCard`), and the list is now paged
 * because the feed is fifteen entries and will be more.
 *
 * The article text comes from `lib/news.ts`, not from `messages/*.json`: it is
 * the admin panel's content, not the site's chrome. Reading `?page=` opts this
 * route into dynamic rendering, which is correct for a list whose contents the
 * client edits.
 */
export default async function NewsPage({ params, searchParams }: PageProps<"/[locale]/news">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { page } = await searchParams;
  const t = await getTranslations({ locale, namespace: "newsPage" });
  const { items, page: current, pageCount } = await fetchNewsPage(locale, page);

  return (
    <>
      <Section className="pt-12!">
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          title={t("title")}
          description={t("description")}
        />

        <Container>
          {items.length === 0 ? (
            <NewsGridSkeleton />
          ) : (
            <>
              <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
                {items.map((article, index) => (
                  <RevealItem key={article.slug} className="h-full">
                    <ArticleCard article={article} priority={current === 1 && index < 3} />
                  </RevealItem>
                ))}
              </RevealGroup>

              <NewsPagination page={current} pageCount={pageCount} />
            </>
          )}
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}

/**
 * Stands in for the grid while there is nothing to show — same card frame as
 * `ArticleCard` (photo, then a light panel with a date line and a headline),
 * repeated six times, so the swap to real content doesn't jolt the layout.
 * Pulses as one unit rather than per-piece, same treatment as
 * `NewsSection`'s own skeleton on the homepage.
 */
function NewsGridSkeleton() {
  return (
    <div className="mt-12 animate-pulse" style={{ animationDuration: "3.2s" }}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-card border border-brand-black/10 bg-surface"
          >
            <div className="aspect-5/3 bg-brand-black/8" />
            <div className="space-y-3 p-5 sm:p-6">
              <div className="h-2.5 w-20 rounded-control bg-brand-black/10" />
              <div className="h-5 w-4/5 rounded-control bg-brand-black/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
