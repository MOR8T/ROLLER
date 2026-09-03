"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

/**
 * The "САЙТ В РАЗРАБОТКЕ" takeover, shown instead of the whole public site
 * while «Настройки сайта» → «Сайт в разработке» is on
 * (`app/[locale]/layout.tsx` decides; `lib/site-settings.ts` reads the flag).
 *
 * It is a faithful rebuild of the placeholder the client put on roller.tj in
 * 2026-09 — a window drawn stroke by stroke, its handle filling in, then the
 * ROLLER logo fading up over it — rather than a new design, so the switch
 * swaps between the site and exactly the page visitors already saw there.
 *
 * Two departures from that original, both deliberate:
 *   - the timeline is CSS + a few lines of measurement here rather than GSAP,
 *     which would be a new dependency for one screen;
 *   - the caption is translated (`messages/*.json` → `maintenance`) instead of
 *     being Russian on every locale, since this renders under `[locale]`.
 *
 * Everything visual lives in `app/globals.css` under "Maintenance screen";
 * see that block for the palette and the timing constants' CSS twins.
 */

/**
 * The stagger between one stroke starting and the next, in step with
 * `--maintenance-delay` in `app/globals.css`.
 *
 * This is the one part of the timeline that cannot live in CSS: the order is
 * by *path length*, shortest first, which is what makes the outline read as
 * assembly rather than as a list of shapes lighting up — and only
 * `getTotalLength()` at runtime knows that order. The durations and easings
 * are all in the stylesheet.
 */
const STROKE_STAGGER_MS = 80;

export function MaintenanceScreen() {
  const t = useTranslations("maintenance");
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Layout effect, not `useEffect`: this runs before the browser paints, so
  // the outline never shows up finished for a frame and then restart.
  useIsomorphicLayoutEffect(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    if (!stage || !svg) return;

    // Reduced motion, and no-JS, leave every element in its finished state —
    // see the stylesheet: the animations supply the *starting* state through
    // `animation-fill-mode: both`, so the fallback is the drawn window rather
    // than a blank screen.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const strokes = Array.from(svg.querySelectorAll<SVGGeometryElement>(".maintenance-stroke"));
    const byLength = strokes.sort((a, b) => a.getTotalLength() - b.getTotalLength());

    for (const [index, shape] of byLength.entries()) {
      shape.style.setProperty("--maintenance-length", `${shape.getTotalLength()}`);
      shape.style.setProperty("--maintenance-delay", `${index * STROKE_STAGGER_MS}ms`);
    }

    // One attribute starts the whole timeline — outline, handles and logo
    // plate together. They used to start independently (the strokes here, the
    // other two the moment the stylesheet applied), which drifted apart by
    // however long this component took to hydrate.
    stage.dataset.animate = "true";
  }, []);

  return (
    <div className="maintenance-stage" ref={stageRef}>
      <div className="maintenance-grid" aria-hidden />
      <div className="maintenance-vignette" aria-hidden />

      <div className="maintenance-window" aria-hidden>
        <svg ref={svgRef} viewBox="0 0 517 699" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            className="maintenance-stroke"
            d="M1 1L255.62 1M1 1V697.78M1 1L18.2819 19.4659M255.62 1V697.78M255.62 1L238.338 19.4659M255.62 697.78H1M255.62 697.78L238.338 679.314M1 697.78L18.2819 679.314M238.338 19.4659H18.2819M238.338 19.4659V127.799V149.958V679.314M18.2819 19.4659V127.799V149.958V679.314M238.338 679.314H18.2819"
          />
          <path
            className="maintenance-stroke"
            d="M516 1L261.38 1M516 1V697.78M516 1L498.718 19.4659M261.38 1V697.78M261.38 1L278.662 19.4659M261.38 697.78H516M261.38 697.78L278.662 679.314M516 697.78L498.718 679.314M278.662 19.4659H498.718M278.662 19.4659V127.799V149.958V679.314M498.718 19.4659V127.799V149.958V679.314M278.662 679.314H498.718"
          />
          <rect
            className="maintenance-stroke"
            width="226.351"
            height="669.697"
            transform="matrix(-1 0 0 1 240.643 15.7748)"
          />
          <path
            className="maintenance-stroke"
            d="M47.6073 109.536L207.171 349.362C207.266 349.504 207.266 349.689 207.172 349.831L47.6073 590.688"
          />
          <path
            className="maintenance-stroke"
            d="M207.328 50.8051H47.6079M207.328 50.8051L240.25 16.1896M207.328 50.8051V650.441M47.6079 50.8051L14.2921 15.7748M47.6079 50.8051V650.441M47.6079 650.441H207.328M47.6079 650.441L14.2921 685.472M207.328 650.441L239.875 683.49"
          />
          <rect
            className="maintenance-stroke"
            width="8.28094"
            height="23.7762"
            transform="matrix(-1 0 0 1 14.2913 114.842)"
          />
          <rect
            className="maintenance-stroke"
            width="8.28094"
            height="23.7762"
            transform="matrix(-1 0 0 1 14.2913 566.585)"
          />
          <rect
            className="maintenance-stroke"
            width="10.9873"
            height="27.7389"
            transform="matrix(-1 0 0 1 226.713 340.704)"
          />
          <rect
            className="maintenance-fill"
            style={{ animationDelay: "4.90s" }}
            width="7.32488"
            height="47.5524"
            transform="matrix(1.19249e-08 -1 -1 -1.19249e-08 225.957 357.085)"
          />
          <rect
            className="maintenance-fill"
            style={{ animationDelay: "5.02s" }}
            width="10.9873"
            height="11.8881"
            transform="matrix(-1 0 0 1 226.713 356.563)"
          />
          <rect
            className="maintenance-stroke"
            x="276.358"
            y="15.7748"
            width="226.351"
            height="669.697"
          />
          <path
            className="maintenance-stroke"
            d="M469.392 109.536L309.829 349.362C309.734 349.504 309.734 349.689 309.828 349.831L469.392 590.688"
          />
          <path
            className="maintenance-stroke"
            d="M309.672 50.8051H469.392M309.672 50.8051L276.75 16.1896M309.672 50.8051V650.441M469.392 50.8051L502.708 15.7748M469.392 50.8051V650.441M469.392 650.441H309.672M469.392 650.441L502.708 685.472M309.672 650.441L277.125 683.49"
          />
          <rect
            className="maintenance-stroke"
            x="502.708"
            y="114.842"
            width="8.25171"
            height="23.7762"
          />
          <rect
            className="maintenance-stroke"
            x="502.708"
            y="566.595"
            width="8.25171"
            height="23.7762"
          />
          <rect
            className="maintenance-stroke"
            x="290.287"
            y="340.714"
            width="10.9873"
            height="27.7389"
          />
          <rect
            className="maintenance-fill"
            style={{ animationDelay: "5.14s" }}
            x="291"
            y="357.41"
            width="7.32488"
            height="47.5524"
            transform="rotate(-90 291 357.41)"
          />
          <rect
            className="maintenance-fill"
            style={{ animationDelay: "5.26s" }}
            x="290.287"
            y="356.563"
            width="10.9873"
            height="11.8881"
          />
          <path className="maintenance-stroke" d="M255.62 1H262.533" />
          <path className="maintenance-stroke" d="M255.62 697.789H262.533" />
        </svg>
      </div>

      <div className="maintenance-plate">
        <div className="maintenance-logo">
          <Image src="/maintenance/roller-logo.svg" alt="ROLLER" width={222} height={48} priority />
          <p className="maintenance-caption">{t("caption")}</p>
        </div>
      </div>
    </div>
  );
}
