import Link from "next/link";
import { ArrowUp, Camera, Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { BrandLogo } from "@/components/ui/brand-logo";
import { navLinks, siteConfig } from "@/lib/site-config";

/**
 * Footer
 *
 * IMZO/AKFA-inspired industrial chrome:
 *  - top: subtle red accent strip
 *  - main grid (mobile-first): brand block, nav column, contacts column, social column
 *  - bottom bar: copyright + working hours + back-to-top
 *
 * All copy in Russian (site default locale).
 * Data is sourced from `siteConfig` — no magic values.
 */
export function Footer() {
  const year = new Date().getFullYear();

  const socials = [
    {
      href: siteConfig.social.instagram,
      label: "Instagram ROLLER",
      icon: Camera,
    },
    {
      href: siteConfig.social.telegram,
      label: "Telegram ROLLER",
      icon: Send,
    },
    {
      href: siteConfig.whatsappHref,
      label: "WhatsApp ROLLER",
      icon: MessageCircle,
    },
  ] as const;

  return (
    <footer className="bg-brand-black text-brand-white">
      <div className="h-1 w-full bg-brand-red" aria-hidden />

      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:py-16">
        <div className="max-w-xs">
          <Link
            href="/"
            aria-label={siteConfig.name}
            className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
          >
            <BrandLogo isDark={false} className="h-12 w-auto" />
          </Link>

          <p className="mt-5 text-sm leading-relaxed text-brand-white/70">{siteConfig.slogan.ru}</p>

          <p className="mt-6 text-xs font-medium tracking-[0.18em] text-brand-white/45 uppercase">
            На рынке с {siteConfig.foundedYear} года
          </p>
        </div>

        <nav aria-label="Подвал" className="text-sm">
          <h2 className="font-heading text-sm font-semibold tracking-[0.18em] text-brand-white uppercase">
            Разделы
          </h2>
          <ul className="mt-5 space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block rounded-md py-1.5 text-brand-white/70 transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          <h2 className="font-heading text-sm font-semibold tracking-[0.18em] text-brand-white uppercase">
            Контакты
          </h2>
          <ul className="mt-5 space-y-4 text-brand-white/70">
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-brand-red" aria-hidden />
              <a
                href={siteConfig.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
              >
                {siteConfig.address}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="size-4 shrink-0 text-brand-red" aria-hidden />
              <a
                href={siteConfig.phoneHref}
                className="rounded-md py-1 transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
              >
                {siteConfig.phone}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="size-4 shrink-0 text-brand-red" aria-hidden />
              <a
                href={`mailto:${siteConfig.email}`}
                className="rounded-md py-1 break-all transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
              >
                {siteConfig.email}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Clock className="size-4 shrink-0 text-brand-red" aria-hidden />
              <span>{siteConfig.workingHours}</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-sm font-semibold tracking-[0.18em] text-brand-white uppercase">
            Мы в соцсетях
          </h2>
          <div className="mt-5 flex gap-3">
            {socials.map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid size-10 place-items-center rounded-md border border-brand-white/20 text-brand-white/80 transition-colors hover:border-brand-red hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
              >
                <Icon className="size-5" />
              </a>
            ))}
          </div>

          <ButtonLink
            href={siteConfig.whatsappHref}
            size="sm"
            className="mt-6 w-full max-w-xs rounded-full"
          >
            <MessageCircle className="size-4" />
            Написать в WhatsApp
          </ButtonLink>
        </div>
      </Container>

      <div className="border-t border-brand-white/10">
        <Container className="flex flex-col items-center gap-4 py-6 text-xs text-brand-white/50 sm:flex-row sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Все права защищены.
          </p>
          <div className="flex items-center gap-5">
            <p className="flex items-center gap-2">
              <Clock className="size-3.5 text-brand-red" aria-hidden />
              {siteConfig.workingHours}
            </p>
            <a
              href="#top"
              className="group flex items-center gap-1.5 rounded-md py-1 transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
            >
              <span className="tracking-wide uppercase">Наверх</span>
              <ArrowUp
                className="size-3.5 text-brand-red transition-transform group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>
        </Container>
      </div>
    </footer>
  );
}
