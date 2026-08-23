import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Calculator } from "@/components/calculator/calculator";
import { Breadcrumbs } from "@/components/products/breadcrumbs";
import { Container } from "@/components/ui/container";

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
 * The page is the configurator and nothing else, the way `imzo.uz/calculator`
 * is: no eyebrow, no lead paragraph, no hero. Only the trail and the `<h1>`
 * survive from `PageHeader`, and they survive because every page owes the site
 * one heading (DESIGN.md §4) and a way back up the tree — imzo's own page is
 * poorer for having neither.
 *
 * The word «Калькулятор» promises a number the page never shows. It stays
 * because it is what visitors search for and what the brief calls it (§2.1);
 * the reason there is no number is spelled out under «Отправить».
 */
export default async function CalculatorPage({ params }: PageProps<"/[locale]/calculator">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "calculator" });

  return (
    <>
      <Container className="pt-10">
        <Breadcrumbs items={[{ label: t("breadcrumb") }]} />
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-brand-black sm:text-3xl">
          {t("title")}
        </h1>
      </Container>

      <Calculator />
    </>
  );
}
