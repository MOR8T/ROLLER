import Script from "next/script";

/**
 * Yandex.Metrika and Google Analytics 4, both driven by the counter ids in
 * `lib/seo-config.ts`.
 *
 * A blank id renders nothing at all — not an empty tag, not a disabled
 * script. That is the state the site ships in, and it is what lets this
 * component exist before the client has opened either account: no third-party
 * request leaves the page, so there is nothing to disclose and no consent
 * banner to add until they do.
 *
 * `strategy="afterInteractive"` on both. Analytics is not needed to render and
 * must not compete with the fonts and the hero image for the first seconds of
 * the load; `beforeInteractive` would put a blocking third-party script ahead
 * of the page's own JavaScript, which is exactly the trade-off a site being
 * tuned for search should not make.
 *
 * ⚠️ Metrika is listed first because it is the counter that matters in this
 * market — Yandex is the search engine most of roller.tj's visitors arrive
 * from, and its webmaster tools read the counter directly.
 */
export function Analytics({
  yandexMetrikaId,
  googleAnalyticsId,
}: {
  yandexMetrikaId: string;
  googleAnalyticsId: string;
}) {
  return (
    <>
      {yandexMetrikaId ? (
        <>
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
                webvisor: true
              });
            `}
          </Script>
          {/*
            The no-JavaScript pixel Metrika's own snippet ships with. It is the
            only way a visit from a client with scripting off is counted, and
            Yandex.Webmaster checks for it when verifying the counter.
          */}
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${yandexMetrikaId}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        </>
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
