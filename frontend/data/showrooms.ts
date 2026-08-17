import { siteConfig } from "@/lib/site-config";
import type { Showroom } from "@/types";

/**
 * The showrooms plotted on the homepage map.
 *
 * Coordinates only — every word a visitor reads (city, street, hours) is a
 * message key, because this site ships in four languages and an address is not
 * a language-independent string. See the note on `Showroom` in `types/index.ts`
 * for why the pairs are `[lng, lat]`.
 *
 * ⚠️ Dushanbe is the office address the brief gives (`common.address`), read
 * off the `mapEmbedUrl` already in `site-config.ts` — so the pin and the
 * iframe on `/contacts` cannot drift apart. **Khujand is a placeholder**: the
 * client has not supplied a street address, and the pair below is the city
 * centre, accurate to the city and to nothing smaller. It is marked here rather
 * than quietly shipped so that whoever gets the real address knows there is
 * exactly one line to change.
 */
export const showrooms: Showroom[] = [
  {
    id: "dushanbe",
    coordinates: [68.776335, 38.546573],
    phone: siteConfig.phone,
    phoneHref: siteConfig.phoneHref,
    routeUrl: siteConfig.mapUrl,
    // ⚠️ Temporary, at the client's direction (2026-08-16): both photographs
    // come from `notes/photos/`, which the repository ignores and which is
    // therefore not a source these files can be regenerated from. They were
    // cropped to 4:3 and resampled to 1600px before being committed here.
    // Replace with the final shoot when it lands.
    photo: "/showrooms/dushanbe.jpg",
  },
  {
    id: "khujand",
    // ⚠️ Placeholder — city centre, not the showroom. Replace with the real
    // pair the moment the client sends the address.
    coordinates: [69.622192, 40.283271],
    phone: siteConfig.phone,
    phoneHref: siteConfig.phoneHref,
    routeUrl: "https://yandex.tj/maps/?ll=69.622192%2C40.283271&z=15",
    photo: "/showrooms/khujand.jpg",
  },
];

/**
 * The keyless fallback: Yandex's map *widget*, which is an iframe and needs no
 * developer key, centred on one showroom with a pin on it.
 *
 * This is what the section renders when `NEXT_PUBLIC_YANDEX_MAPS_API_KEY` is
 * absent or the JS API refuses the key — see `showroom-map.tsx`. It is the same
 * mechanism `MapEmbed` already uses on `/contacts`, so the fallback is not new
 * code paying rent, it is the behaviour the site had before this section
 * existed.
 *
 * `pm2rdm` is Yandex's own red medium pin. The brand pin is a DOM element and
 * cannot cross into an iframe, so the fallback is the one place on the map
 * where the marker is Yandex's rather than ours.
 */
export function showroomWidgetUrl([lng, lat]: [number, number]): string {
  const point = `${lng},${lat}`;
  return `https://yandex.tj/map-widget/v1/?ll=${encodeURIComponent(point)}&z=16&pt=${encodeURIComponent(`${point},pm2rdm`)}`;
}
