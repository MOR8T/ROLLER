import { Clock, MapPin, Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { siteConfig } from "@/lib/site-config";

export function ContactsSection() {
  return (
    <Section>
      <Container className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-stretch">
        <div>
          <SectionHeading
            eyebrow="Контакты"
            title="Свяжитесь с нами или приезжайте в офис"
            description="Адрес, телефон, график работы и ссылка на карту уже вынесены в общий конфиг сайта."
          />
          <div className="mt-8 space-y-4">
            <ContactItem icon={MapPin} label="Адрес" value={siteConfig.address} />
            <ContactItem
              icon={Phone}
              label="Телефон"
              value={siteConfig.phone}
              href={siteConfig.phoneHref}
            />
            <ContactItem icon={Clock} label="График" value={siteConfig.workingHours} />
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={siteConfig.mapUrl} variant="outline" className="rounded-full">
              Открыть карту
            </ButtonLink>
            <ButtonLink href={siteConfig.whatsappHref} className="rounded-full">
              Написать в WhatsApp
            </ButtonLink>
          </div>
        </div>

        <div className="min-h-96 overflow-hidden rounded-4xl bg-neutral-100 p-4">
          <iframe
            title="Карта офиса ROLLER"
            src={siteConfig.mapEmbedUrl}
            className="h-full min-h-80 w-full rounded-3xl border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </Container>
    </Section>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-start gap-4 rounded-2xl border border-brand-black/10 bg-brand-white p-4">
      <div className="rounded-xl bg-brand-red/10 p-3 text-brand-red">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-xs font-semibold tracking-[0.18em] text-brand-black/45 uppercase">
          {label}
        </p>
        <p className="mt-1 font-medium text-brand-black">{value}</p>
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block transition-transform hover:-translate-y-0.5">
      {content}
    </a>
  ) : (
    content
  );
}
