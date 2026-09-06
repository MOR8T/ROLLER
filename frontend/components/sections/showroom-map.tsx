"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

import type { ShowroomDto } from "@/lib/showrooms";
import { loadYMaps, type YMapsReact } from "@/lib/ymaps";
import { cn } from "@/lib/utils";

/** How close the map sits once it has settled on a showroom. */
const ZOOM = 16;
/** Milliseconds the JS API spends flying between two showrooms. */
const FLIGHT = 600;

/**
 * The keyless fallback: Yandex's map *widget*, an iframe that needs no
 * developer key, centred on one showroom with a pin on it. Kept here rather
 * than in `lib/showrooms.ts` — that module imports `next/headers` through
 * `lib/admin-auth.ts`, which a "use client" file like this one cannot pull
 * into the browser bundle even for one pure, server-independent function.
 *
 * `pm2rdm` is Yandex's own red medium pin.
 */
function showroomWidgetUrl([lng, lat]: [number, number]): string {
  const point = `${lng},${lat}`;
  return `https://yandex.tj/map-widget/v1/?ll=${encodeURIComponent(point)}&z=16&pt=${encodeURIComponent(`${point},pm2rdm`)}`;
}

/**
 * The map itself.
 *
 * ── Three states, and the middle one is the point ───────────────────────────
 *
 *   loading   a grey plate at the map's own height, so the section does not
 *             jump when the script lands.
 *   ready     Yandex JS API 3 with our own pin as the marker.
 *   fallback  the keyless Yandex map *widget* in an iframe.
 *
 * The fallback is not defensive decoration. JS API 3 refuses to start without a
 * key from the Developer Cabinet, the key is restricted to a list of domains,
 * and activation of a new key takes up to fifteen minutes — so "the map does
 * not load" is the expected state on a preview deploy, on a colleague's
 * machine, and for the first quarter of an hour after anybody touches the key.
 * In every one of those cases the visitor still gets a map with a pin on it,
 * because that is what `/contacts` has been serving through `MapEmbed` all
 * along. What they lose is the brand pin and the flight between cities.
 *
 * ── Why the pin is a DOM node ───────────────────────────────────────────────
 *
 * `YMapMarker` renders arbitrary children at a coordinate — the JS API supplies
 * no default marker of its own — so the pin below is a button, in our own SVG,
 * in brand colours, focusable by keyboard and hoverable like anything else on
 * the page. imzo.uz, which this section is modelled on, ships Yandex's stock
 * `islands#icon` recoloured to `#1e1e1e`; ours is the shape from the brandbook.
 */
export function ShowroomMap({
  showrooms,
  activeId,
  onSelect,
  labels,
  className,
}: {
  showrooms: ShowroomDto[];
  activeId: string;
  onSelect: (id: string) => void;
  /** `city` per showroom id, for the marker's accessible name. */
  labels: Record<string, string>;
  className?: string;
}) {
  const locale = useLocale();
  const [ymaps, setYmaps] = useState<YMapsReact | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    loadYMaps(locale).then(
      (loaded) => alive && setYmaps(loaded),
      () => alive && setFailed(true),
    );

    return () => {
      alive = false;
    };
  }, [locale]);

  const active = showrooms.find((showroom) => showroom.id === activeId) ?? showrooms[0];

  // A new object on every render would restart the flight on every render. The
  // identity has to change exactly when the destination does — and it does:
  // `coordinates` is a distinct array per entry in the module-level
  // `showrooms`, so its reference already tracks the selection.
  const location = useMemo(
    () => ({ center: active.coordinates, zoom: ZOOM, duration: FLIGHT }),
    [active.coordinates],
  );

  const frame = cn("relative overflow-hidden rounded-[1.75rem] bg-neutral-100", className);

  if (failed) {
    return (
      <div className={frame}>
        <iframe
          title={labels[active.id]}
          src={showroomWidgetUrl(active.coordinates)}
          className="h-full w-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (!ymaps) {
    return <div className={frame} aria-hidden />;
  }

  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } = ymaps;

  return (
    <div className={frame}>
      <YMap location={location} mode="vector">
        <YMapDefaultSchemeLayer />
        <YMapDefaultFeaturesLayer />

        {showrooms.map((showroom) => (
          <YMapMarker key={showroom.id} coordinates={showroom.coordinates}>
            {/* The marker's DOM is anchored by its top-left corner, so the
                wrapper pulls the pin up and left until the tip of the teardrop
                — not the corner of its box — sits on the coordinate. */}
            <div className="-translate-x-1/2 -translate-y-full">
              <Pin
                label={labels[showroom.id]}
                active={showroom.id === active.id}
                onClick={() => onSelect(showroom.id)}
              />
            </div>
          </YMapMarker>
        ))}
      </YMap>
    </div>
  );
}

/**
 * One pin.
 *
 * Black by default: the homepage spends its red in two places and a map full of
 * it would be a third (see the note at the top of `home-kit.tsx`). The selected
 * pin is the exception, and it earns the accent by being the only one — the
 * city the visitor has actually asked about.
 */
function Pin({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "block origin-bottom cursor-pointer transition-transform duration-300 focus-visible:outline-none",
        active ? "scale-110" : "hover:scale-105 active:scale-110",
      )}
    >
      <svg
        width="34"
        height="44"
        viewBox="0 0 34 44"
        fill="none"
        aria-hidden
        className={cn(
          "drop-shadow-[0_4px_10px_rgba(0,0,0,0.35)] transition-colors duration-300",
          active ? "text-brand-red" : "text-brand-black",
        )}
      >
        <path
          d="M17 0C7.611 0 0 7.611 0 17c0 12.75 17 27 17 27s17-14.25 17-27c0-9.389-7.611-17-17-17Z"
          fill="currentColor"
        />
        <circle cx="17" cy="17" r="6" fill="#fff" />
      </svg>
    </button>
  );
}
