import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/layout/page-header";
import { ArticleCard } from "@/components/news/article-card";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { Container } from "@/components/ui/container";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { articles } from "@/data/news";

export async function generateMetadata({ params }: PageProps<"/[locale]/news">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsPage" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * `/news` — the article list. Content is mock and is managed from the admin
 * panel once stage 12 exists; what ships here is the list, the article page and
 * the shape the API will return.
 */
export default async function NewsPage({ params }: PageProps<"/[locale]/news">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "newsPage" });

  return (
    <>
      <Section>
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <Container>
          <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {articles.map((article) => (
              <RevealItem key={article.slug} className="h-full">
                <ArticleCard article={article} />
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </Section>

      <LeadFormSection />
    </>
  );
}
