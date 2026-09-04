import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buildPageMetadata } from "@/lib/page-metadata";
import { SEO_PAGE_PATHS } from "@/lib/seo";

import { PageHeader } from "@/components/layout/page-header";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { ShowroomsDirectory } from "@/components/sections/showrooms-directory";
import { Section } from "@/components/ui/section";
import { getShowrooms } from "@/lib/showrooms";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/showroom">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "showroom" });

  // The copy is this page's own, from `messages/*.json`; `buildPageMetadata`
  // adds everything structural around it — canonical, hreflang, Open Graph,
  // robots — from `lib/seo-config.ts`.
  return buildPageMetadata({
    locale,
    path: SEO_PAGE_PATHS.showroom,
    pageKey: "showroom",
    title: t("metaTitle"),
    description: t("metaDescription"),
  });
}

/**
 * `/showroom` — rebuilt on 2026-08-16 against imzo.uz/contacts at the client's
 * request. Three blocks, in their order:
 *
 *   header     the title and the one sentence under it.
 *   directory  the view toggle, the city picker, and the map or the list.
 *   contacts   the office contacts and the short request form.
 *
 * ⚠️ What this replaced, and why none of it survived:
 *
 *   • **Three fact cards** (address, hours, phone) above a static
 *     `MapEmbed`. Both are now inside `ShowroomsDirectory`, per city rather
 *     than per company — the page used to describe one showroom at the office
 *     address, and there are two. `MapEmbed` had no other caller and was
 *     deleted with them.
 *
 *   • **"Что есть в шоуруме"** — a four-item list of what a visitor would find
 *     on arrival. Written when the page had nothing else to say; imzo's page
 *     answers "where" and "how do I reach you" and says nothing about what is
 *     on the shelves, and the client asked for imzo's page.
 *
 *   • **`LeadFormSection`** — replaced by `ContactsLeadSection` here and on
 *     every other page in the same pass, at the client's request. The
 *     component and its `leadForm` messages are gone.
 */
export default async function ShowroomPage({ params }: PageProps<"/[locale]/showroom">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "showroom" });
  const showrooms = await getShowrooms(locale);

  return (
    <>
      <Section className="pt-12! pb-0">
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          title={t("title")}
          description={t("description")}
        />
      </Section>

      <ShowroomsDirectory showrooms={showrooms} />

      <ContactsLeadSection />
    </>
  );
}
