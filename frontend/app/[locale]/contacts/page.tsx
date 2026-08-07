import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AtSign, Send } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { ContactsSection } from "@/components/sections/contacts-section";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/lib/site-config";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contacts">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contactsPage" });

  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * `/contacts` — address, phones, messengers, hours, map and the request form.
 *
 * The cards, the map and the two primary actions already exist as
 * `ContactsSection` on the homepage, and they are reused rather than
 * re-laid-out: two different contact blocks would be two places to update the
 * phone number.
 */
export default async function ContactsPage({ params }: PageProps<"/[locale]/contacts">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contactsPage" });

  const socials = [
    // Lucide dropped its brand glyphs; the footer's own Instagram/Telegram
    // SVGs carry hardcoded clipPath ids and would collide with the footer on
    // this very page, so these are the neutral lucide marks.
    { key: "instagram", icon: AtSign, href: siteConfig.social.instagram },
    { key: "telegram", icon: Send, href: siteConfig.social.telegram },
  ] as const;

  return (
    <>
      <Section className="pb-0">
        <PageHeader
          breadcrumbs={[{ label: t("breadcrumb") }]}
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
      </Section>

      <ContactsSection />

      <Section tone="muted">
        <Container>
          <Reveal className="grid gap-4 sm:grid-cols-2">
            {socials.map((social) => (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-card border border-brand-black/10 bg-surface p-6 transition-colors hover:border-brand-red/30 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="rounded-control bg-brand-red/10 p-3 text-brand-red">
                  <social.icon className="size-6 shrink-0" aria-hidden />
                </span>
                <span>
                  <span className="block font-heading text-lg font-bold text-brand-black">
                    {t(`social.${social.key}.title`)}
                  </span>
                  <span className="mt-1 block text-sm text-brand-black/60">
                    {t(`social.${social.key}.description`)}
                  </span>
                </span>
              </a>
            ))}
          </Reveal>
        </Container>
      </Section>

      <LeadFormSection />
    </>
  );
}
