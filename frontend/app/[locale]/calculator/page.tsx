import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Calculator } from "@/components/calculator/calculator";
import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/calculator">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calculator" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * `/calculator` — `project_plan/06-*.md`.
 *
 * The route is not `/calculator` and the menu item is not «Калькулятор»: the
 * word promises a number, and this page deliberately never shows one. It
 * assembles a construction and ends in a request.
 */
export default async function CalculatorPage({ params }: PageProps<"/[locale]/calculator">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "calculator" });

  return (
    <>
      <Section className="pb-0">
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
        <Container>
          <p className="mt-6 max-w-3xl rounded-card border border-brand-black/10 bg-surface-muted p-5 text-sm leading-6 text-brand-black/65">
            {t("noPrice")}
          </p>
        </Container>
      </Section>

      <Calculator />
    </>
  );
}
