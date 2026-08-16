import * as React from "react";
import * as ReactDOM from "react-dom";

/**
 * Loading Yandex JS API 3.0 once, for the whole browser tab.
 *
 * The JS API is not an npm package. It is a `<script>` from Yandex's CDN that
 * installs a `ymaps3` global, and everything downstream — the React bindings
 * included — comes out of that global at runtime. `@yandex/ymaps3-types` is a
 * types-only devDependency describing it (see `types/ymaps3.d.ts`); no part of
 * the JS API is in our bundle.
 *
 * ── Why a module-level promise ──────────────────────────────────────────────
 *
 * The script may only be injected once per document, and `reactify.bindTo` may
 * only run once per React instance. A `useEffect` in the map component would do
 * both again on every mount — and this section is on the homepage, which a
 * visitor can leave and come back to without a reload. Caching the promise on
 * the module makes the second mount free and the tenth mount free.
 */

/**
 * ⚠️ Public by construction: `NEXT_PUBLIC_*` is inlined into the client bundle,
 * so this key is visible to anyone who reads the page source. That is how the
 * JS API works — a browser has to send it — and the protection is not secrecy
 * but the domain allow-list in the Yandex Developer Cabinet. Restrict the key
 * to `roller.tj` (and `localhost` for development) there, or it is usable from
 * any site on the internet at our quota's expense.
 */
export const ymapsApiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";

/**
 * Our locales onto the JS API's `language_REGION` codes.
 *
 * Tajik is not among the languages the JS API renders, so `tg` takes Russian —
 * which is what the map labels around Dushanbe and Khujand read as anyway. Only
 * the map's own furniture is affected (copyright line, control tooltips); every
 * word this section contributes comes from `messages/*.json` and is in the
 * visitor's language regardless.
 */
const langs: Record<string, string> = {
  ru: "ru_RU",
  tg: "ru_RU",
  en: "en_US",
  tr: "tr_TR",
};

export type YMapsReact = Awaited<ReturnType<typeof load>>;

let pending: Promise<YMapsReact> | null = null;

/**
 * Resolves with the reactified JS API entities, or rejects if the script never
 * arrives — no key, a key the Cabinet has not activated yet (activation takes
 * up to 15 minutes), a domain the key does not cover, or no network. Callers
 * are expected to handle the rejection by rendering something else rather than
 * by throwing: see the iframe fallback in `showroom-map.tsx`.
 *
 * `locale` is honoured on the first call only. The script carries its language
 * in its URL and there is one script per document, so a client-side locale
 * switch leaves the map's furniture in the previous language until the next
 * full page load. Our own strings re-render normally.
 */
export function loadYMaps(locale: string): Promise<YMapsReact> {
  pending ??= load(locale);
  return pending;
}

async function load(locale: string) {
  if (!ymapsApiKey) {
    throw new Error("NEXT_PUBLIC_YANDEX_MAPS_API_KEY is not set");
  }

  await injectScript(locale);
  await ymaps3.ready;

  const ymaps3React = await ymaps3.import("@yandex/ymaps3-reactify");
  const reactify = ymaps3React.reactify.bindTo(React, ReactDOM);

  const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker } =
    reactify.module(ymaps3);

  return { reactify, YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker };
}

function injectScript(locale: string): Promise<void> {
  const src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(ymapsApiKey)}&lang=${langs[locale] ?? langs.ru}`;

  return new Promise((resolve, reject) => {
    // Survives React's development double-effect and a second component asking
    // for the map in the same tick: the tag is the lock.
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (typeof ymaps3 !== "undefined") resolve();
      else {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("ymaps3 failed")), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        // Leave nothing behind that would make the next attempt think the
        // script is already on its way.
        script.remove();
        reject(new Error("ymaps3 failed to load"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
}
