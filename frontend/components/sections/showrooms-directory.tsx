"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Check, Clock, MapPin, Phone } from "lucide-react";

import { CitySelect } from "@/components/sections/city-select";
import { pillClass } from "@/components/sections/home-kit";
import { ShowroomMap } from "@/components/sections/showroom-map";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import type { ShowroomDto } from "@/lib/showrooms";
import { cn } from "@/lib/utils";

type View = "map" | "list";

/**
 * The body of `/showroom`, modelled on imzo.uz/contacts.
 *
 * ── What this shares with the homepage ──────────────────────────────────────
 *
 * `CitySelect`, `ShowroomMap` and `data/showrooms.ts` — the three pieces that
 * carry behaviour — are the same ones `ShowroomsSection` uses, and the copy
 * comes from the same `showrooms` namespace. What differs is only the frame:
 * the homepage section ends in a "Подробнее" link pointing here, which on this
 * page would be a link to itself, and it has no room for a list. Rendering
 * `ShowroomsSection` directly would have meant threading both of those through
 * as props into a component three elements long.
 *
 * ── The view toggle ─────────────────────────────────────────────────────────
 *
 * imzo.uz offers "Карта" and "Списком" because it has seventy-odd showrooms and
 * a map is a poor way to read seventy addresses. We have two, so the list is
 * short — but it is the only place on the site that states both addresses, both
 * sets of hours and both phones together, which is what a visitor arriving from
 * the "Шоурумы" menu item came for, and that is why the list opens first. The
 * map is one tap away for the visitor whose question is "where is it".
 *
 * ── One city picker per view ────────────────────────────────────────────────
 *
 * The dropdown only ships with the map, because on the map a city is a *camera
 * position*: there is one viewport and something has to say which of the two
 * pins it flies to. The list has no camera — both cards are on the page, both
 * are readable, and a dropdown above them would be a control that hides nothing
 * and reveals nothing. There the cards are the picker: tapping one selects that
 * city, and the choice is what the map opens on when the visitor switches over.
 *
 * ⚠️ imzo.uz has a second filter beside the city — "Официальные", separating
 * their own showrooms from partners' and franchisees'. Both of ours are our
 * own, so that control would have exactly one option; it is left out rather
 * than shipped as a dropdown that cannot change anything.
 *
 * ⚠️ Showrooms moved from the static `data/showrooms.ts` fixture to the admin
 * panel on 2026-08-26 — `showrooms` is now a prop, fetched server-side by
 * `app/[locale]/showroom/page.tsx` through `lib/showrooms.ts`. City, address
 * and hours arrive already resolved for the current locale, so this
 * component no longer reads them out of the `showrooms` message namespace.
 */
export function ShowroomsDirectory({ showrooms }: { showrooms: ShowroomDto[] }) {
  const t = useTranslations("showrooms");
  const [view, setView] = useState<View>("list");
  const [activeId, setActiveId] = useState(showrooms[0]?.id);

  if (showrooms.length === 0 || !activeId) return null;

  const options = showrooms.map((showroom) => ({
    id: showroom.id,
    label: showroom.city,
  }));
  const cities = Object.fromEntries(options.map((option) => [option.id, option.label]));

  return (
    <Section id="showrooms" tone="muted">
      <Container>
        {/* `relative z-30` for the same reason as on the homepage: `Reveal`
            animates opacity and so boxes the picker's dropdown into its own
            stacking context. See the note in `showrooms-section.tsx`. */}
        <Reveal className="relative z-30 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label={t("title")}
            className="flex w-fit gap-1 rounded-full bg-brand-black/6 p-1"
          >
            {(["list", "map"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={cn(
                  "min-h-10 cursor-pointer rounded-full px-6 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none",
                  view === option
                    ? "bg-brand-white text-brand-black shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                    : "text-brand-black/55 hover:text-brand-black",
                )}
              >
                {t(`views.${option}`)}
              </button>
            ))}
          </div>

          {/* Map only — see the note above. */}
          {view === "map" ? (
            <CitySelect
              options={options}
              value={activeId}
              onChange={setActiveId}
              label={t("title")}
            />
          ) : null}
        </Reveal>

        <Reveal className="relative z-0 mt-8">
          {view === "map" ? (
            <ShowroomMap
              showrooms={showrooms}
              activeId={activeId}
              onSelect={setActiveId}
              labels={cities}
              className="h-[24rem] sm:h-[30rem] lg:h-[36rem]"
            />
          ) : (
            // Two columns only at `lg`. At `sm` the cards would be ~345px wide
            // while the photograph had already widened to 4/3, which put the
            // picture under half the card — the one thing the layout is not
            // allowed to do. See the ratio note on the photo below.
            <ul className="grid gap-4 lg:grid-cols-2">
              {showrooms.map((showroom) => (
                <li key={showroom.id}>
                  <ShowroomCard
                    showroom={showroom}
                    city={cities[showroom.id]}
                    selected={showroom.id === activeId}
                    onSelect={() => setActiveId(showroom.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </Container>
    </Section>
  );
}

/**
 * One showroom, in the shape the client picked on 2026-08-16: a photograph
 * filling the top of the card and dissolving into it, a badge floating over the
 * picture, then the city, the address and two actions.
 *
 * ── The dissolve ────────────────────────────────────────────────────────────
 *
 * The photograph has no bottom edge. A gradient from `transparent` to the
 * card's own white is laid over its lower third, and the text block is pulled
 * up into that fade with a negative margin — so the heading sits on what still
 * reads as the picture. This is the whole trick of the reference design, and it
 * is why the card is a single white surface rather than a picture stacked on a
 * panel: the gradient has to end in exactly the colour underneath it, or the
 * seam it was meant to hide reappears as a band.
 *
 * That is also why an unselected card is no longer `bg-brand-white/60`. A
 * gradient ending in translucent white over a grey section reads as a smear;
 * selection is carried by the card's edge instead.
 *
 * ── Selecting ───────────────────────────────────────────────────────────────
 *
 * The whole card is the hit area, through a transparent button laid over it —
 * the card cannot *be* a button, because it already contains two links and
 * nesting those inside one is invalid HTML and unreachable by a keyboard. The
 * overlay sits under the actions row, so "Позвонить" and "Проложить маршрут"
 * keep their own clicks, and it carries `aria-pressed`, so a screen reader gets
 * the selected state rather than a heading that looks the same either way.
 *
 * The state is said three ways, because a border alone is a poor answer to
 * "which one is chosen": a black edge doubled by a ring, a deeper shadow, and a
 * badge in words over the photograph. The words are what survive a colour-blind
 * reading and a phone in sunlight.
 */
function ShowroomCard({
  showroom,
  city,
  selected,
  onSelect,
}: {
  showroom: ShowroomDto;
  city: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations("showrooms");
  const tCommon = useTranslations("common");

  return (
    <article
      className={cn(
        // No padding on the article: the photograph runs to the card's edges and
        // `overflow-hidden` clips it into the corners. The text carries its own.
        "relative flex h-full flex-col overflow-hidden rounded-[2rem] border bg-brand-white",
        "transition-[border-color,box-shadow] duration-300",
        selected
          ? // `ring-1` and not `border-2`: a ring is painted outside the border
            // box, so the edge reads as twice as thick without the card's contents
            // shifting a pixel when the selection moves.
            "border-brand-black shadow-[0_28px_70px_-24px_rgba(29,29,27,0.55)] ring-1 ring-brand-black"
          : "border-brand-black/10 shadow-[0_24px_60px_-28px_rgba(29,29,27,0.45)] hover:border-brand-black/35",
      )}
    >
      {/* First in the DOM so a keyboard reaches "select this one" before the
          two links inside the card, and `z-10` because that order would
          otherwise put it *under* the photograph, which is positioned too.
          `z-20` on the actions row keeps the links on top of it. No focus ring
          offset — the card's own edge is where the ring belongs, and an offset
          one would sit on the grey section outside it. */}
      <button
        type="button"
        aria-pressed={selected}
        aria-label={t("select", { city })}
        onClick={onSelect}
        className="absolute inset-0 z-10 cursor-pointer rounded-[2rem] focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:outline-none focus-visible:ring-inset"
      />

      {/* More than 60% of the card, per the client's brief and measured rather
          than assumed. Three ratios, because the text below is a near-constant
          height and so claims a bigger share of a narrow card than of a wide
          one: portrait on a phone, landscape once the card widens to the full
          column, squarer again at `lg` where two columns halve the width. The
          `lg` ratio is 6/5 and not 5/4 because 5/4 measured exactly 60.0% at
          exactly 1024px — the boundary, not past it. */}
      <div className="relative aspect-[4/5] w-full sm:aspect-[4/3] lg:aspect-[6/5]">
        <MediaFrame
          src={showroom.photo}
          fill
          alt={t("photoAlt", { city })}
          placeholderLabel={t("photoPlaceholder")}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 600px"
        />

        {/* The dissolve.
            ⚠️ `from-brand-white/0`, never `from-transparent`: Tailwind's
            `transparent` is transparent *black*, so the browser interpolates
            from rgba(0,0,0,0) to opaque white and greys the middle of the ramp
            — the fade came out muddy and had not reached white by the time the
            heading sat on it. White-to-white keeps the hue constant and only
            the alpha moves.

            Half the photo's height, with the midpoint pushed to 70% opacity, so
            the last 40px — the strip the heading is pulled up into — is white
            for all practical purposes. `pointer-events-none` so it never eats a
            click, and `to-brand-white` must stay in step with the article's own
            background or the seam it hides comes back as a band. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-brand-white/0 via-brand-white/70 to-brand-white"
        />

        {/* The badge, over the picture. One and not five: the reference is a
            feature list and this is a place, and the working hours are the only
            thing about a showroom that belongs on a label rather than in a
            line of text. Inventing four more would be inventing facts. */}
        <p className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-brand-black/70 px-4 py-2 text-xs font-semibold text-brand-white backdrop-blur-sm">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          <span className="sr-only">{t("labels.hours")}: </span>
          {showroom.hours}
        </p>

        {/* Opposite the hours badge, and solid rather than translucent: this one
            is a state, not a fact about the place, and it has to win the glance
            against whatever photograph is underneath it. */}
        {selected ? (
          <p className="absolute top-5 right-5 inline-flex items-center gap-2 rounded-full bg-brand-black px-4 py-2 text-xs font-semibold text-brand-white">
            <Check className="size-3.5 shrink-0" aria-hidden />
            {t("selectedBadge")}
          </p>
        ) : null}
      </div>

      {/* `-mt-10` lifts the heading into the fade — see the note above. */}
      <div className="relative -mt-10 flex flex-1 flex-col px-7 pb-7 sm:px-8 sm:pb-8">
        <h2 className="font-heading text-3xl font-bold tracking-tight text-brand-black">{city}</h2>

        <p className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed text-brand-black/65">
          <MapPin className="mt-0.5 size-4 shrink-0 text-brand-black/35" aria-hidden />
          <span className="sr-only">{t("labels.address")}: </span>
          {showroom.address}
        </p>

        {/* `relative z-20` keeps both links above the selection overlay — see
            the note on the component. */}
        <div className="relative z-20 mt-7 flex flex-wrap gap-3">
          <a href={showroom.phoneHref} className={pillClass("dark")}>
            <Phone className="size-4 shrink-0" aria-hidden />
            {tCommon("call")}
          </a>
          <a
            href={showroom.routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={pillClass("light")}
          >
            {t("route")}
            <ArrowUpRight className="size-4 shrink-0" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
