import { getLocale, getTranslations } from "next-intl/server";

import { HomeSection } from "@/components/sections/home-kit";
import { ContactsLeadForm } from "@/components/sections/contacts-lead-form";
import { getContactInfo } from "@/lib/contact-info";
import { getContactInterests } from "@/lib/contact-interests";

export interface ContactsLeadSectionProps {
  id?: string;
  /** Overrides `home.contacts.title`. */
  title?: string;
  /** A line under the heading. The homepage has none. */
  description?: string;
  /** Where the request came from, written for a human: «Система ROLLER». */
  context?: string;
}

/**
 * «Свяжитесь с нами» — a two-column block: the company's contact list on the
 * left, a quick-lead form on the right. Rendered on `/contacts` and six other
 * pages (see `git grep ContactsLeadSection`).
 *
 * A Server Component so the contact list can `await getContactInfo` — it is
 * managed from the admin panel (`app/admin/(dashboard)/contacts/page.tsx`),
 * not hardcoded from `lib/site-config.ts` any more. `getContactInfo` returns
 * `null`, never fabricated content, when the backend has nothing yet;
 * `ContactsSkeleton` below renders instead, same convention as
 * `HeroSection`/`PartnersSection`'s own skeletons. The form stays a separate
 * client component (`ContactsLeadForm`) since it needs its own state.
 */
export async function ContactsLeadSection({
  id = "contacts",
  title,
  description,
  context,
}: ContactsLeadSectionProps = {}) {
  const t = await getTranslations("home.contacts");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const [contactInfo, interests] = await Promise.all([
    getContactInfo(locale),
    getContactInterests(locale),
  ]);

  const contacts = contactInfo
    ? [
        { key: "address", value: contactInfo.address, href: contactInfo.mapUrl },
        { key: "phone", value: contactInfo.phone, href: contactInfo.phoneHref },
        { key: "email", value: contactInfo.email, href: contactInfo.emailHref },
        { key: "whatsapp", value: tCommon("writeWhatsapp"), href: contactInfo.whatsappHref },
      ]
    : [];

  return (
    <HomeSection id={id} tone="muted">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {title ?? t("title")}
          </h2>

          {description ? (
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-black/65">{description}</p>
          ) : null}

          {contacts.length === 0 ? (
            <ContactsSkeleton />
          ) : (
            <ul className="mt-10">
              {contacts.map((contact) => (
                <li key={contact.key}>
                  <a
                    href={contact.href}
                    target={contact.href.startsWith("http") ? "_blank" : undefined}
                    rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="block border-t border-brand-black/12 py-5 font-heading text-lg font-semibold text-brand-black transition-colors hover:text-brand-black/55 focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none sm:text-xl"
                  >
                    {contact.value}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ContactsLeadForm context={context} interests={interests} />
      </div>
    </HomeSection>
  );
}

/** Four rows the size of the real contact links, so nothing jumps when the
 * fetched data replaces it. Same `animate-pulse` convention as
 * `HeroSection`'s `HeroSkeleton`/`PartnersSection`'s `PartnersSkeleton`. */
function ContactsSkeleton() {
  return (
    <div className="mt-10 animate-pulse" style={{ animationDuration: "3.2s" }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="border-t border-brand-black/12 py-5">
          <div className="h-6 w-2/3 rounded-control bg-brand-black/10 sm:h-7" />
        </div>
      ))}
    </div>
  );
}
