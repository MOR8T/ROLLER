"use client";

import { useState } from "react";
import Image from "next/image";

import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { ImzoSection, imzoMuted, imzoRadius } from "./section-kit";
import type { ProductFinishesSectionData } from "@/types/product-page";

/**
 * Laminations left, the system wearing the chosen one right.
 *
 * The reference's numbers: swatches 135×120 with a 20px radius and a 1px
 * border — `#85766f` at rest, black when active — in a 600px column; the render
 * in a 780×500 card, also 20px, on a `rgba(0,0,0,0.05)` ground. The swatches
 * here are a fifth smaller (108×96) at the client's request, which is also what
 * fits three to a row in the 35% column.
 *
 * imzo's swatches change the picture, and so do ours; the difference is that we
 * have a full set of renders per colourway, so the picture is the system in
 * that lamination rather than a crop of a swatch.
 */
export function ProductFinishesSection({
  data,
  locale,
}: {
  data: ProductFinishesSectionData;
  locale: Locale;
}) {
  const [selected, setSelected] = useState(0);
  const active = data.finishes[selected] ?? data.finishes[0];
  const activeLabel = active ? localized(active.label, locale) : "";
  const note = localized(data.note, locale);

  return (
    <ImzoSection id={data.id} tall>
      {/* 35 / 65: the swatches get a third of the row and the render the rest —
          `fr` rather than percentages, so the two shares split what is left
          after the gap instead of overflowing it. */}
      <div className="grid gap-10 lg:grid-cols-[35fr_65fr] lg:items-center lg:gap-12">
        <div>
          <ul className="-mt-9 flex flex-wrap gap-x-5 gap-y-1">
            {data.finishes.map((finish, index) => {
              const label = localized(finish.label, locale);
              const isActive = index === selected;

              return (
                // `group` and `relative` carry the tooltip: it is a child of the
                // swatch's own cell, so it lands over that swatch and nowhere
                // else. `pt-9` reserves the room it needs above the row —
                // without it the first row's tooltip would be clipped by the
                // section, and the swatches would jump when it appeared.
                <li key={index} className="group relative pt-9">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 rounded-[0.5rem] bg-black px-3 py-1.5 text-sm leading-none whitespace-nowrap text-white opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    {label}
                  </span>

                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setSelected(index)}
                    className={cn(
                      // The chosen lamination has to read from across the row,
                      // and a 1px border does not — least of all around the
                      // white swatch, which is nearly the page's own colour. An
                      // offset ring reads on every one of the seven.
                      // 108×96 — the reference's 135×120 less a fifth, at the
                      // client's request; the 20px radius is scaled with them
                      // so the corner keeps its proportion.
                      "block h-24 w-27 cursor-pointer rounded-[1rem] border bg-cover bg-center transition-[box-shadow,border-color] focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:outline-none",
                      isActive
                        ? "border-black shadow-[0_0_0_2px_#fff,0_0_0_4px_#000]"
                        : "border-[#85766f] hover:border-black/60",
                    )}
                    style={
                      finish.kind === "texture" && finish.texture
                        ? { backgroundImage: `url(${finish.texture.src})` }
                        : { backgroundColor: finish.color ?? "#e5e5e5" }
                    }
                  >
                    <span className="sr-only">{label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* No caption under the row on a pointer device: the hover tooltip
              names the lamination, and the render beside it shows the choice. A
              line repeating the name a third time was the one thing on this
              block the reference does not have.

              ⚠️ Below `lg` that leaves the seven swatches unnamed, because a
              touch screen has no hover and the tooltip above never opens — the
              colours were reachable but anonymous on every phone. The name of
              the *selected* one is shown there instead, which is one line
              rather than seven and disappears again at `lg`, where the tooltip
              takes over and the reference layout is restored. */}
          {activeLabel ? (
            <p className="mt-6 text-base leading-[1.4] font-medium text-black lg:hidden">
              {activeLabel}
            </p>
          ) : null}

          {note ? (
            <p className={cn("mt-7 max-w-[32rem] text-base leading-[1.4]", imzoMuted)}>{note}</p>
          ) : null}
        </div>

        <div
          className={cn("relative aspect-[78/50] w-full overflow-hidden bg-black/5", imzoRadius)}
        >
          {active?.image ? (
            <Image
              key={active.image.src}
              src={active.image.src}
              alt={localized(active.image.alt, locale)}
              fill
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain p-6 sm:p-10"
            />
          ) : (
            <p
              className={cn(
                "absolute inset-0 grid place-items-center px-8 text-center text-base",
                imzoMuted,
              )}
            >
              {localized(data.placeholder, locale)}
            </p>
          )}
        </div>
      </div>
    </ImzoSection>
  );
}
