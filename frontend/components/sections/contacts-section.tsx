import { useTranslations } from "next-intl";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { siteConfig } from "@/lib/site-config";

type ContactCard = {
  key: string;
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
  hint?: string;
};

export function ContactsSection() {
  const t = useTranslations("contacts");
  const tCommon = useTranslations("common");

  // Built inside the component rather than at module scope: two of the four
  // values (the street address, the opening hours) are translated, so the list
  // can only exist once a locale is known.
  const contactCards: ContactCard[] = [
    {
      key: "address",
      icon: MapPin,
      label: t("cards.address.label"),
      value: tCommon("address"),
      href: siteConfig.mapUrl,
      hint: t("cards.address.hint"),
    },
    {
      key: "phone",
      icon: Phone,
      label: t("cards.phone.label"),
      value: siteConfig.phone,
      href: siteConfig.phoneHref,
      hint: t("cards.phone.hint"),
    },
    {
      key: "email",
      icon: Mail,
      label: t("cards.email.label"),
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
      hint: t("cards.email.hint"),
    },
    {
      key: "hours",
      icon: Clock,
      label: t("cards.hours.label"),
      value: tCommon("workingHours"),
    },
  ];

  return (
    <Section id="contacts">
      <Container>
        <Reveal>
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch lg:gap-8">
          <RevealGroup className="grid gap-4 sm:grid-cols-2">
            {contactCards.map((card) => (
              <RevealItem key={card.key}>
                <ContactCardView card={card} />
              </RevealItem>
            ))}
          </RevealGroup>

          <Reveal className="flex flex-col-reverse gap-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={siteConfig.whatsappHref} size="lg" className="flex-1">
                <MessageCircle className="size-5 shrink-0" />
                {tCommon("writeWhatsapp")}
              </ButtonLink>
              <ButtonLink
                href={siteConfig.phoneHref}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Phone className="size-5 shrink-0" />
                {tCommon("call")}
              </ButtonLink>
            </div>

            {/* Large media blocks keep square corners — DESIGN.md §5. */}
            <div className="relative flex-1 overflow-hidden border border-brand-black/10 bg-neutral-50">
              <iframe
                title={t("mapTitle")}
                src={siteConfig.mapEmbedUrl}
                className="h-full min-h-80 w-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function ContactCardView({ card }: { card: ContactCard }) {
  const Icon = card.icon;
  const content = (
    <div className="group flex h-full flex-col gap-4 rounded-card border border-brand-black/10 bg-neutral-50 p-6 transition-colors duration-300 hover:border-brand-red/30 hover:bg-brand-white">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-control bg-brand-red/10 p-3 text-brand-red transition-colors duration-300 group-hover:bg-brand-red group-hover:text-brand-white">
          <Icon className="size-6 shrink-0" />
        </div>
        <span className="text-right font-heading text-xs font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
          {card.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1">
        <p className="font-heading text-lg font-semibold text-brand-black">{card.value}</p>
        {card.hint ? (
          <p className="text-xs font-medium text-brand-black/50 transition-colors duration-300 group-hover:text-brand-red">
            {card.hint}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (!card.href) return content;

  return (
    <a
      href={card.href}
      className="block h-full rounded-card focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      target={card.href.startsWith("http") ? "_blank" : undefined}
      rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {content}
    </a>
  );
}
