import { PageHeader } from "@/components/layout/page-header";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { Section } from "@/components/ui/section";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buildPageMetadata } from "@/lib/page-metadata";
import { SEO_PAGE_PATHS } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contacts">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactsPage" });

  // The copy is this page's own, from `messages/*.json`; `buildPageMetadata`
  // adds everything structural around it — canonical, hreflang, Open Graph,
  // robots — from `lib/seo-config.ts`.
  return buildPageMetadata({
    locale,
    path: SEO_PAGE_PATHS.contacts,
    pageKey: "contacts",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

export default async function ContactsPage({ params }: PageProps<"/[locale]/contacts">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contactsPage" });

  return (
    <>
      <Section className="pt-12! pb-0">
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          title={t("title")}
          description={t("description")}
        />
      </Section>
      <ContactsLeadSection id="request" />
    </>
  );
}
