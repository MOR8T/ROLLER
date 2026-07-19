import Link from "next/link";
import { Camera, Clock, MapPin, Phone, Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { navLinks, siteConfig } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-brand-black/10 bg-brand-black text-brand-white">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-heading text-2xl font-bold">
            ROLLER<span className="text-brand-red">.TJ</span>
          </div>
          <p className="mt-4 text-sm text-brand-white/70">{siteConfig.slogan.ru}</p>
          <p className="mt-1 text-sm text-brand-white/50">{siteConfig.slogan.tg}</p>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold tracking-wide uppercase">Разделы</h3>
          <ul className="mt-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-brand-white/70 transition-colors hover:text-brand-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold tracking-wide uppercase">Контакты</h3>
          <ul className="mt-4 space-y-3 text-sm text-brand-white/70">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0" />
              {siteConfig.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4 shrink-0" />
              <a href={siteConfig.phoneHref} className="hover:text-brand-white">
                {siteConfig.phone}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 shrink-0" />
              {siteConfig.workingHours}
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-heading text-sm font-semibold tracking-wide uppercase">
            Мы в соцсетях
          </h3>
          <div className="mt-4 flex gap-3">
            <a
              href={siteConfig.social.instagram}
              aria-label="Instagram"
              className="rounded-md border border-brand-white/20 p-2 transition-colors hover:border-brand-red hover:text-brand-red"
            >
              <Camera className="size-5" />
            </a>
            <a
              href={siteConfig.social.telegram}
              aria-label="Telegram"
              className="rounded-md border border-brand-white/20 p-2 transition-colors hover:border-brand-red hover:text-brand-red"
            >
              <Send className="size-5" />
            </a>
          </div>
        </div>
      </Container>

      <div className="border-t border-brand-white/10">
        <Container className="py-6 text-center text-xs text-brand-white/50">
          © {new Date().getFullYear()} ROLLER.TJ. Все права защищены.
        </Container>
      </div>
    </footer>
  );
}
