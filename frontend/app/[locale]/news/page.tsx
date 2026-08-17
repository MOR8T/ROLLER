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

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/[locale]/news">): Promise<Metadata> {
  const { locale } = await params;
  const { page } = await searchParams;
  const t = await getTranslations({ locale, namespace: "newsPage" });
  const { page: current } = await fetchNewsPage(locale, page);

  return {
    title:
      current > 1
        ? `${t("metaTitle")} — ${t("pagination.page", { page: current })}`
        : t("metaTitle"),
    description: t("metaDescription"),
    // ⚠️ No `alternates.canonical` pointing page 2+ back at `/news`, though the
    // pages do want one: `metadataBase` is not configured anywhere on the site,
    // and Next resolves a relative canonical against it — in production that
    // silently becomes a localhost URL, which is worse than no canonical at
    // all. Add both together, or neither.
  };
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
 * per-locale date instead of `06.07.2026`, and the black card panel in place of
 * the accent colour they use.
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
      <Section>
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          title={t("title")}
          description={t("description")}
        />

        <Container>
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {items.map((article, index) => (
              <RevealItem key={article.slug} className="h-full">
                <ArticleCard article={article} priority={current === 1 && index < 3} />
              </RevealItem>
            ))}
          </RevealGroup>

          <NewsPagination page={current} pageCount={pageCount} />
        </Container>
      </Section>

      <ContactsLeadSection />
    </>
  );
}
