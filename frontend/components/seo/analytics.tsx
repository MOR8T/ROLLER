import Script from "next/script";

/**
 * Yandex.Metrika, Google Tag Manager and Google Analytics 4, all driven by the
 * ids in `lib/seo-config.ts`.
 *
 * A blank id renders nothing at all — not an empty tag, not a disabled
 * script. That is the state the site ships in, and it is what lets this
 * component exist before the client has opened an account: no third-party
 * request leaves the page, so there is nothing to disclose and no consent
 * banner to add until they do.
 *
 * `strategy="afterInteractive"` on all of them. Analytics is not needed to
 * render and must not compete with the fonts and the hero image for the first
 * seconds of the load; `beforeInteractive` would put a blocking third-party
 * script ahead of the page's own JavaScript, which is exactly the trade-off a
 * site being tuned for search should not make.
 *
 * ⚠️ Google's own instructions say to paste the GTM snippet "as high in the
 * `<head>` as possible". `afterInteractive` does not do that, and deliberately
 * so: `next/script` injects the tag once the page is interactive, which is the
 * placement Next's own `@next/third-parties` `GoogleTagManager` component uses
 * for the identical snippet. The container still loads on every route and
 * `dataLayer` is still created before it; what is given up is measuring the
 * first few hundred milliseconds, and what is bought is that a third-party
 * container cannot block the first render.
 *
 * ⚠️ Metrika is listed first because it is the counter that matters in this
 * market — Yandex is the search engine most of roller.tj's visitors arrive
 * from, and its webmaster tools read the counter directly.
 */
export function Analytics({
  yandexMetrikaId,
  googleTagManagerId,
  googleAnalyticsId,
  maintenance = false,
}: {
  yandexMetrikaId: string;
  googleTagManagerId: string;
  googleAnalyticsId: string;
  /**
   * The visitor is looking at the «Сайт в разработке» placeholder rather than
   * the site.
   *
   * Those visits are counted — somebody arriving at a closed site is exactly
   * the number worth knowing while it is closed — but they are *labelled*,
   * because they are not comparable to a visit to the real site. The
   * placeholder lives at the same four URLs the homepage does, so without a
   * label a closed week and an open week are indistinguishable afterwards, and
   * every report that spans the launch is quietly wrong.
   *
   * Reading the label: in GTM it is the `site_mode` Data Layer Variable (and
   * the value `"maintenance"` is worth excluding in the GA4 tag's trigger); in
   * Metrika it is a visit parameter under «Отчёты» → «Параметры визитов».
   * Neither needs a code change — but neither happens on its own either, so
   * until somebody configures it the placeholder views land in the same
   * reports as the rest, just carrying the label.
   */
  maintenance?: boolean;
}) {
  // Pushed *inside* the GTM snippet rather than from a `<Script>` of its own:
  // two `afterInteractive` scripts have no guaranteed order between them, and a
  // label that lands after `gtm.js` has already fired is a label GTM's own
  // trigger never sees.
  const dataLayerLabel = maintenance ? `w[l].push({'site_mode':'maintenance'});` : "";

  return (
    <>
      {yandexMetrikaId ? (
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

              ym(${JSON.stringify(yandexMetrikaId)}, "init", {
                clickmap: true,
                trackLinks: true,
                accurateTrackBounce: true,
                webvisor: true${maintenance ? `,\n                params: { site_mode: "maintenance" }` : ""}
              });
            `}
        </Script>
      ) : null}

      {googleTagManagerId ? (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
              (function(w,d,s,l,i){w[l]=w[l]||[];${dataLayerLabel}w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer',${JSON.stringify(googleTagManagerId)});
            `}
        </Script>
      ) : null}

      {googleAnalyticsId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', ${JSON.stringify(googleAnalyticsId)});
            `}
          </Script>
        </>
      ) : null}
    </>
  );
}

/**
 * The `<noscript>` halves of the same two counters, rendered as the **first
 * child of `<body>`**.
 *
 * They are split out of `Analytics` for one reason: Google Tag Manager's
 * instructions place its iframe "immediately after the opening `<body>` tag",
 * and that is not a style note — the fallback exists to record a visit from a
 * client that will never run the script above, so it has to be in the markup
 * the server sent rather than anywhere JavaScript would have put it. Metrika's
 * pixel has the same job and no placement requirement of its own, so it rides
 * along instead of sitting in a second `<noscript>` elsewhere on the page.
 *
 * Neither renders when its id is blank, exactly like the scripts.
 */
export function AnalyticsNoScript({
  yandexMetrikaId,
  googleTagManagerId,
}: {
  yandexMetrikaId: string;
  googleTagManagerId: string;
}) {
  if (!yandexMetrikaId && !googleTagManagerId) return null;

  return (
    <noscript>
      {googleTagManagerId ? (
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(googleTagManagerId)}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          // A `<noscript>` frame is never focusable in practice, but assistive
          // technology that ignores `visibility: hidden` would otherwise
          // announce an unnamed frame.
          title="Google Tag Manager"
        />
      ) : null}

      {yandexMetrikaId ? (
        // The no-JavaScript pixel Metrika's own snippet ships with. It is the
        // only way a visit from a client with scripting off is counted, and
        // Yandex.Webmaster checks for it when verifying the counter.
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://mc.yandex.ru/watch/${yandexMetrikaId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      ) : null}
    </noscript>
  );
}
