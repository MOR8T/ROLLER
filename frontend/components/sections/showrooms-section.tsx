"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { CitySelect } from "@/components/sections/city-select";
import { HomeHeading, HomeSection } from "@/components/sections/home-kit";
import { ShowroomMap } from "@/components/sections/showroom-map";
import { Reveal } from "@/components/ui/reveal";
import { showrooms } from "@/data/showrooms";

/**
 * "Шоурумы" — the map block, added on the client's brief to match the section
 * of the same name on imzo.uz.
 *
 * The shape is theirs: a heading, a city picker and a link out on one row, and
 * the map full width underneath. The picker was a pair of cards beside the map
 * until the client asked for imzo's dropdown on 2026-08-16 — which also gave
 * the map the full column width, so it is the change that made the section
 * bigger rather than the one that made it smaller.
 *
 * What did not come across from imzo.uz:
 *
 *   • **The hidden native `<select>`.** See the note in `city-select.tsx` —
 *     ours is one control rather than a styled list shadowing an invisible
 *     element that only a screen reader can reach.
 *
 *   • **The stock pin.** Theirs is Yandex's `islands#icon` with the fill
 *     changed to `#1e1e1e`. Ours is drawn — see `Pin` in `showroom-map.tsx`.
 *
 *   • **Any prose at all.** Every other homepage section lost its deck in the
 *     2026-08-13 pass (see `home-kit.tsx`); this one is not going to be the
 *     section that brings it back.
 *
 * ⚠️ A strip of address, hours and phone for the chosen city sat under the map
 * until the client removed it on 2026-08-16. It was duplicated copy: the very
 * next section on the page is `ContactsLeadSection`, which lists the address
 * and the phone, and `/showroom` behind "Подробнее" has both plus the hours.
 * A pin on a map is the one thing neither of those can show, and it is now all
 * this section claims to do. The strings stay in `messages/*.json` — the
 * picker still reads `points.<id>.city` from them.
 *
 * Picker and map stay in step in both directions: choosing a city flies the
 * map, and clicking a pin moves the picker.
 */
export function ShowroomsSection() {
  // The `showrooms` namespace, not `home.*`: `/showroom` reads the same city
  // names and addresses through `ShowroomsDirectory`, and one set of strings
  // is the only way the two stay in agreement.
  const t = useTranslations("showrooms");
  const [activeId, setActiveId] = useState(showrooms[0].id);

  const options = showrooms.map((showroom) => ({
    id: showroom.id,
    label: t(`points.${showroom.id}.city`),
  }));
  const cities = Object.fromEntries(options.map((option) => [option.id, option.label]));

  return (
    <HomeSection id="showrooms" tone="muted">
      {/* `relative z-30` is what lets the picker's panel hang over the map.
          `Reveal` animates opacity, so each one is its own stacking context and
          the `z-20` inside the dropdown cannot reach past it — the map's
          `Reveal` comes later in the DOM and would paint over the list. Raising
          this wrapper settles the two against each other instead. */}
      <Reveal className="relative z-30">
        <HomeHeading
          title={t("title")}
          action={{ label: t("action"), href: "/showroom" }}
          control={
            <CitySelect
              options={options}
              value={activeId}
              onChange={setActiveId}
              label={t("title")}
            />
          }
        />
      </Reveal>

      <Reveal className="relative z-0 mt-10">
        <ShowroomMap
          showrooms={showrooms}
          activeId={activeId}
          onSelect={setActiveId}
          labels={cities}
          className="h-[22rem] sm:h-[28rem] lg:h-[34rem]"
        />
      </Reveal>
    </HomeSection>
  );
}
