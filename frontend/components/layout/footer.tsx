import { getLocale, getTranslations } from "next-intl/server";
import { ArrowUp, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Link } from "@/i18n/navigation";
import { getContactInfo } from "@/lib/contact-info";
import { getSocialLinks } from "@/lib/social-links";
import { SocialIcon, WhatsAppIcon } from "@/components/icons/social-icons";
import type { SocialNetwork } from "@/lib/social-networks";
import { navLinks, siteConfig } from "@/lib/site-config";

/** Binds a `SocialLink` row's network key to `SocialIcon` so it fits the
 * same `{ icon: Component }` shape `WhatsAppIcon` already has below. */
function makeSocialIcon(network: SocialNetwork) {
  return function Icon({ className }: { className?: string }) {
    return <SocialIcon network={network} className={className} />;
  };
}

/**
 * Footer
 *
 * IMZO/AKFA-inspired industrial chrome:
 *  - top: subtle red accent strip
 *  - main grid (mobile-first): brand block, nav column, contacts column, social column
 *  - bottom bar: copyright + working hours + back-to-top
 *
 * Address/phone/email/map link come from `getContactInfo` — the same
 * admin-managed data `ContactsLeadSection` reads — so the footer never
 * drifts from what `/contacts` shows. The social icons come from
 * `getSocialLinks` (its own admin-managed list, `SocialLink` on the
 * backend) plus a WhatsApp icon derived from `contactInfo.whatsappHref`.
 * Brand facts that aren't "contact info" (name, founded year, nav links)
 * still come from `siteConfig`; copy from `messages/*.json`.
 *
 * Both reads independently return `null` on failure — never a fabricated
 * fallback — and `socials` mirrors that: `null` means "still don't know
 * what to show", rendered as `SocialSkeleton` below, not an empty column
 * that looks like the client configured zero social links.
 */
export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const [contactInfo, socialLinks] = await Promise.all([getContactInfo(locale), getSocialLinks()]);

  // Passed to ICU as a string on purpose: `{year}` typed as a number would be
  // formatted per locale and render "2 026" in Russian.
  const year = String(new Date().getFullYear());

  const socials = socialLinks
    ? [
        ...socialLinks.map((link) => ({
          href: link.url,
          label: t(link.network),
          icon: makeSocialIcon(link.network),
        })),
        ...(contactInfo
          ? [{ href: contactInfo.whatsappHref, label: t("whatsapp"), icon: WhatsAppIcon }]
          : []),
      ]
    : null;

  return (
    // `relative z-10` is layering, not positioning — nothing inside is placed
    // against it. The homepage hangs a brand-mark watermark off a `fixed`
    // layer inside a `relative` wrapper (`app/[locale]/page.tsx`), and a
    // positioned element paints in a later step than a static one: with the
    // footer left static, the whole of `main` — watermark included — was drawn
    // over it, and the grey mark landed on top of the footer's own links.
    // Giving the footer a positioned layer of its own puts it back on top,
    // where opaque page chrome belongs.
    <footer className="relative z-10 bg-brand-black text-brand-white">
      <div className="h-1 w-full bg-brand-red" aria-hidden />

      {/* Four columns from `xl`, not `lg`. At 1024 a quarter of the container
          is 216px, and the contacts column has to fit an address, a phone and
          `rollerunopen2006@gmail.com` next to a 16px icon — the email broke
          mid-word ("…@gmail.|com") and the address ran to three lines. Two
          columns at that width give each 460px and every line fits. It is also
          the breakpoint the header already switches on, so 1024 reads as one
          layout rather than a desktop footer under a tablet header. */}
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:py-16 xl:grid-cols-4 xl:gap-8">
        <div className="max-w-xs">
          <Link
            href="/"
            aria-label={siteConfig.name}
            className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90"
          >
            <BrandLogo isDark={false} className="h-12 w-auto" />
          </Link>

          <p className="mt-5 text-sm leading-relaxed text-brand-white/85">{tCommon("slogan")}</p>

          <p className="mt-6 text-xs font-medium tracking-[0.18em] text-brand-white/85 uppercase">
            {t("onMarketSince", { year: String(siteConfig.foundedYear) })}
          </p>
        </div>

        <nav aria-label={t("nav")} className="text-sm">
          <h2 className="font-heading text-sm font-semibold tracking-[0.18em] text-brand-white uppercase">
            {t("sections")}
          </h2>
          <ul className="mt-5 space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block rounded-control py-1.5 text-brand-white/85 transition-colors hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                >
                  {tNav(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="text-sm">
          <h2 className="font-heading text-sm font-semibold tracking-[0.18em] text-brand-white uppercase">
            {t("contacts")}
          </h2>
          <ul className="mt-5 space-y-4 text-brand-white/85">
            {contactInfo ? (
              <>
                <li className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-red" aria-hidden />
                  <a
                    href={contactInfo.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-control transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                  >
                    {contactInfo.address}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="size-4 shrink-0 text-brand-red" aria-hidden />
                  <a
                    href={contactInfo.phoneHref}
                    className="rounded-control py-1 transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                  >
                    {contactInfo.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="size-4 shrink-0 text-brand-red" aria-hidden />
                  <a
                    href={contactInfo.emailHref}
                    className="rounded-control py-1 break-all transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                  >
                    {contactInfo.email}
                  </a>
                </li>
              </>
            ) : null}
            <li className="flex items-center gap-3">
              <Clock className="size-4 shrink-0 text-brand-red" aria-hidden />
              <span>{tCommon("workingHours")}</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-heading text-sm font-semibold tracking-[0.18em] text-brand-white uppercase">
            {t("social")}
          </h2>
          {socials === null ? (
            <SocialSkeleton />
          ) : (
            <div className="mt-5 flex gap-3">
              {socials.map(({ href, label, icon: Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-10 place-items-center rounded-control border border-brand-white/20 text-brand-white/80 transition-colors hover:border-brand-red hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          )}
        </div>
      </Container>

      <div className="border-t border-brand-white/10">
        <Container className="flex flex-col items-center gap-4 py-6 text-xs text-brand-white/85 sm:flex-row sm:justify-between">
          <p>{t("rights", { year, name: siteConfig.name })}</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <p className="flex items-center gap-2">
              <Clock className="size-3.5 shrink-0 text-brand-red" aria-hidden />
              {tCommon("workingHours")}
            </p>
            <a
              href="#top"
              className="group flex items-center gap-1.5 rounded-control py-1 transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
            >
              <span className="tracking-wide uppercase">{t("toTop")}</span>
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

/** Three buttons the size of the real social icons, so nothing jumps when
 * the fetched links replace it. Same `animate-pulse` convention as
 * `ContactsLeadSection`'s `ContactsSkeleton`. */
function SocialSkeleton() {
  return (
    <div className="mt-5 flex animate-pulse gap-3" style={{ animationDuration: "3.2s" }}>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="size-10 rounded-control border border-brand-white/10 bg-brand-white/10"
        />
      ))}
    </div>
  );
}
