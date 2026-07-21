import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { siteConfig } from "@/lib/site-config";

type ContactCard = {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
  hint?: string;
};

const contactCards: ContactCard[] = [
  {
    icon: MapPin,
    label: "Адрес",
    value: siteConfig.address,
    href: siteConfig.mapUrl,
    hint: "Открыть карту",
  },
  {
    icon: Phone,
    label: "Телефон",
    value: siteConfig.phone,
    href: siteConfig.phoneHref,
    hint: "Позвонить",
  },
  {
    icon: Mail,
    label: "Email",
    value: siteConfig.email,
    href: `mailto:${siteConfig.email}`,
    hint: "Написать на почту",
  },
  {
    icon: Clock,
    label: "График работы",
    value: siteConfig.workingHours,
  },
];

const socialLinks = [
  { label: "Instagram", href: siteConfig.social.instagram },
  { label: "Telegram", href: siteConfig.social.telegram },
];

export function ContactsSection() {
  return (
    <Section id="contacts" className="bg-brand-white">
      <Container>
        <Reveal preset="fade-up">
          <SectionHeading
            eyebrow="Контакты"
            title="Свяжитесь с нами или приезжайте в офис"
            description="Адрес, телефон, почта и график работы — всё в одном месте. Откройте карту, чтобы построить маршрут, или напишите нам в WhatsApp."
          />
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch lg:gap-8">
          <Reveal preset="stagger" className="grid gap-4 sm:grid-cols-2">
            {contactCards.map((card) => (
              <RevealItem key={card.label}>
                <ContactCardView card={card} />
              </RevealItem>
            ))}
          </Reveal>

          <Reveal preset="fade-up" delay={0.1} className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={siteConfig.whatsappHref} size="lg" className="flex-1 rounded-full">
                <MessageCircle className="size-5" />
                Написать в WhatsApp
              </ButtonLink>
              <ButtonLink
                href={siteConfig.phoneHref}
                variant="outline"
                size="lg"
                className="flex-1 rounded-full"
              >
                <Phone className="size-5" />
                Позвонить
              </ButtonLink>
            </div>

            <div className="flex items-center gap-2 text-sm text-brand-black/65">
              <span className="h-px flex-1 bg-brand-black/10" />
              <span className="font-heading text-xs font-semibold tracking-[0.24em] uppercase">
                Мы в соцсетях
              </span>
              <span className="h-px flex-1 bg-brand-black/10" />
            </div>

            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <ButtonLink
                  key={social.label}
                  href={social.href}
                  variant="ghost"
                  className="rounded-full border border-brand-black/10 px-5"
                >
                  {social.label}
                </ButtonLink>
              ))}
            </div>

            <div className="relative flex-1 overflow-hidden rounded-4xl border border-brand-black/10 bg-neutral-50 p-3">
              <iframe
                title="Карта офиса ROLLER"
                src={siteConfig.mapEmbedUrl}
                className="h-full min-h-80 w-full rounded-3xl border-0"
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
    <div className="group flex h-full flex-col gap-4 rounded-3xl border border-brand-black/10 bg-neutral-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/30 hover:bg-brand-white hover:shadow-[0_24px_60px_-40px_rgba(29,29,27,0.35)]">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-brand-red/10 p-3 text-brand-red transition-colors duration-300 group-hover:bg-brand-red group-hover:text-brand-white">
          <Icon className="size-6" />
        </div>
        <span className="font-heading text-xs font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
          {card.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-1">
        <p className="font-heading text-lg font-semibold text-brand-black">{card.value}</p>
        {card.hint ? (
          <p className="text-xs font-medium text-brand-red/80 transition-colors duration-300 group-hover:text-brand-red">
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
      className="block h-full rounded-3xl focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
      target={card.href.startsWith("http") ? "_blank" : undefined}
      rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {content}
    </a>
  );
}
