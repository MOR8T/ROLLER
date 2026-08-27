import { PageHeader } from "@/components/layout/page-header";
import { ContactsLeadSection } from "@/components/sections/contacts-lead-section";
import { Section } from "@/components/ui/section";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contacts">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactsPage" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}


export default async function ContactsPage({ params }: PageProps<"/[locale]/contacts">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contactsPage" });

  return (
    <>
      <Section className="pb-0 pt-12!">
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
