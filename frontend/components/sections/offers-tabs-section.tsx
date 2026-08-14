"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { HomeHeading, HomeSection, PillLink } from "@/components/sections/home-kit";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { homeOffers } from "@/data/home";
import { cn } from "@/lib/utils";

/**
 * "Предложения" — three audiences, four links each.
 *
 * Tabs are underlined words, not filled chips: a chip row is three coloured
 * blocks competing with the heading above them, and the only thing that has to
 * be visible here is which of the three is open. The panel is a list of names —
 * the sentence that used to sit under each one, and the paragraph that used to
 * introduce the whole panel, are on the pages the names link to.
 *
 * ── Tabs, properly ──────────────────────────────────────────────────────────
 *
 * `role="tablist"` with arrow-key navigation. Only the active tab is in the tab
 * order (`tabIndex={-1}` on the rest); Left/Right move between them and focus
 * follows selection — the automatic-activation pattern, and the right one here
 * because every panel is already rendered.
 *
 * All three panels stay mounted and the inactive ones are `hidden`. Rendering
 * only the active one would drop two thirds of the links out of the document,
 * and those links are what this block is for.
 */
export function OffersTabsSection() {
  const t = useTranslations("home.offers");
  const uid = useId();
  const [active, setActive] = useState(0);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;

    event.preventDefault();
    const next = (active + step + homeOffers.length) % homeOffers.length;
    setActive(next);
    document.getElementById(`${uid}-tab-${homeOffers[next].key}`)?.focus();
  }

  return (
    <HomeSection id="offers">
      <Reveal>
        <HomeHeading title={t("title")} />
      </Reveal>

      <Reveal className="mt-10">
        <div
          role="tablist"
          aria-label={t("title")}
          onKeyDown={onKeyDown}
          className="flex flex-wrap gap-x-8 gap-y-2 border-b border-brand-black/12"
        >
          {homeOffers.map((offer, index) => {
            const selected = index === active;

            return (
              <button
                key={offer.key}
                id={`${uid}-tab-${offer.key}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${uid}-panel-${offer.key}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(index)}
                className={cn(
                  "-mb-px border-b-2 pb-4 font-heading text-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none sm:text-xl",
                  selected
                    ? "border-brand-black text-brand-black"
                    : "border-transparent text-brand-black/35 hover:text-brand-black/70",
                )}
              >
                {t(`tabs.${offer.key}.label`)}
              </button>
            );
          })}
        </div>

        {homeOffers.map((offer, index) => (
          <div
            key={offer.key}
            id={`${uid}-panel-${offer.key}`}
            role="tabpanel"
            aria-labelledby={`${uid}-tab-${offer.key}`}
            hidden={index !== active}
          >
            <ul className="grid sm:grid-cols-2 sm:gap-x-12 lg:gap-x-20">
              {offer.links.map((link) => (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    className="group flex items-center justify-between gap-4 border-b border-brand-black/10 py-6 font-heading text-lg font-semibold text-brand-black transition-colors hover:text-brand-black/55 focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none sm:py-7 sm:text-xl"
                  >
                    {t(`tabs.${offer.key}.links.${link.key}`)}
                    <ArrowUpRight
                      className="size-5 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <PillLink href={offer.cta} className="mt-10">
              {t(`tabs.${offer.key}.cta`)}
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </PillLink>
          </div>
        ))}
      </Reveal>
    </HomeSection>
  );
}
