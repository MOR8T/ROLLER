import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

import { CountUp } from "@/components/sections/count-up";
import { HomeSection, PillLink } from "@/components/sections/home-kit";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import type { AboutStat } from "@/lib/about";

/**
 * "О компании" — two sentences and four numbers.
 *
 * The numbers are set as large as the heading and stand on rules rather than in
 * cards. Four boxed figures read as a dashboard; four figures separated by
 * hairlines read as a claim, which is what they are.
 *
 * The production chain (Замер → Производство → Монтаж → Сервис) that used to
 * close this block is gone from the homepage: it is four more labels saying
 * what the two sentences above already say, and `/about` sets it out properly.
 *
 * `title`/`body`/`stats` all come from `lib/about.ts`'s `getAboutContent` (the
 * same singleton `/about` reads) — `title`/`body` since 2026-08-29 (moved out
 * of `messages/*.json`'s `home.about.title`/`.body` so an admin can edit them
 * from `/admin/about`), `stats` since 2026-08-27. `null`/an empty array
 * (backend unreachable) skips the real copy for a skeleton rather than
 * fabricating one — same rule `AboutStatsSkeleton` already followed for the
 * numbers. Only the "О компании" link text stays in `messages/*.json`: static
 * nav-level copy, not something this admin form edits.
 */
export function AboutStatsSection({
  title,
  body,
  stats,
}: {
  title: string | null;
  body: string | null;
  stats: AboutStat[];
}) {
  const t = useTranslations("home.about");
  const tProduction = useTranslations("production");

  return (
    <HomeSection id="about" tone="muted">
      <Reveal className="max-w-3xl">
        {title && body ? (
          <>
            <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {title}
            </h2>
            <p className="mt-6 text-lg leading-8 text-brand-black/60">{body}</p>
          </>
        ) : (
          <AboutTextSkeleton />
        )}
        <PillLink href="/about" className="mt-8">
          {t("more")}
          <ArrowRight className="size-4 shrink-0" aria-hidden />
        </PillLink>
      </Reveal>

      {/* A rule above each figure rather than a box around it, and no vertical
          dividers: a column rule has to know where the row ends, and that
          answer changes at every breakpoint. A top rule per cell is correct at
          two columns and at four without knowing either. */}
      {stats.length > 0 ? (
        <RevealGroup className="mt-16 grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4 lg:gap-x-12">
          {stats.map((stat) => (
            <RevealItem key={stat.key} className="border-t border-brand-black/15 pt-6">
              {/* `tabular-nums` is load-bearing here, not typographic taste: the
                  digits change every frame while counting, and proportional
                  figures would make the whole row jitter sideways as they do. */}
              <CountUp
                value={stat.value}
                suffix={stat.suffix}
                className="block font-heading text-4xl font-bold tracking-tight text-brand-black tabular-nums sm:text-5xl lg:text-6xl"
              />
              <p className="mt-3 text-sm leading-6 text-brand-black/50">
                {tProduction(`stats.${stat.key}`)}
              </p>
            </RevealItem>
          ))}
        </RevealGroup>
      ) : (
        <AboutStatsSkeleton />
      )}
    </HomeSection>
  );
}

/**
 * Stands in for the title/body while the backend has nothing yet — same
 * pulse treatment as `AboutStatsSkeleton` below, sized against the real
 * heading/paragraph so the block doesn't jump once content arrives.
 */
function AboutTextSkeleton() {
  return (
    <div className="animate-pulse" style={{ animationDuration: "3.2s" }}>
      <div className="h-9 w-full max-w-xl rounded-control bg-brand-black/10 sm:h-10 lg:h-12" />
      <div className="mt-3 h-9 w-2/3 rounded-control bg-brand-black/10 sm:h-10 lg:h-12" />
      <div className="mt-6 h-5 w-full max-w-lg rounded-control bg-brand-black/10" />
      <div className="mt-2 h-5 w-1/2 rounded-control bg-brand-black/10" />
    </div>
  );
}

/**
 * Stands in for the four numbers while the backend has nothing yet — same
 * rule-topped frame, same treatment as `HeroSection`'s/`PartnersSection`'s
 * own skeletons: pulses as one unit, no fabricated figures.
 */
function AboutStatsSkeleton() {
  return (
    <div
      className="mt-16 grid animate-pulse grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4 lg:gap-x-12"
      style={{ animationDuration: "3.2s" }}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="border-t border-brand-black/15 pt-6">
          <div className="h-10 w-20 rounded-control bg-brand-black/10 sm:h-12 lg:h-14" />
          <div className="mt-3 h-3 w-28 rounded-control bg-brand-black/10" />
        </div>
      ))}
    </div>
  );
}
