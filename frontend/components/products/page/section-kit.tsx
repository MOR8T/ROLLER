"use client";

import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localized } from "@/lib/localized";
import { cn, isExternalHref } from "@/lib/utils";
import type { ProductAction, ProductSection } from "@/types/product-page";

/**
 * imzo.uz, measured.
 *
 * ⚠️ This file deliberately leaves the site's design system. The client asked
 * for the product page to be a copy of imzo.uz — not an interpretation of it in
 * ROLLER's tokens — so every value below was read off the reference at 1440px
 * with `getComputedStyle`, not chosen:
 *
 *   page          1400px inside 1440 → but see below: the page column is the
 *                 site's `Container`, not the reference's
 *   section       50px top and bottom; media sections have none and stand on
 *                 their own height instead
 *   headings      Montserrat 700. Section 24px fixed; the dark block 2.43vw;
 *                 the form 2.68vw; the hero 3.08vw — the three big ones scale
 *                 with the viewport, the section heading does not
 *   body          16px/400, line-height 1.4; the hero lead 1.24vw/500
 *   muted         #909090
 *   grey ground   rgba(144, 144, 144, 0.1)
 *   buttons       pill, radius 30px, min-height 48px, 16px/500, black or white
 *   media         radius 20px
 *
 * The one measurement deliberately *not* copied is the page column. The
 * reference runs 1400px wide with a 20px gutter; this page uses `Container`
 * like every other page on the site, so the header, the footer and every
 * section here start on the same vertical line. A product page whose text began
 * 20px from the edge while the header began at the gutter would read as a
 * misalignment, not as a faithful copy.
 *
 * Two further consequences worth stating out loud. Colours are pure `#000`/`#fff`, not
 * `--color-brand-black`, and brand red does not appear on this page at all —
 * the reference has neither. And headings run in Montserrat: `globals.css`
 * points every `h1`–`h6` at Chakra Petch, so each heading here undoes it with
 * `font-sans`. Nothing outside `components/products/page/` may import this
 * file; the rest of the site still follows DESIGN.md — including the request
 * block that closes this page, which is the site's own `ContactsLeadSection`.
 */

export const imzoGrey = "bg-[rgba(144,144,144,0.1)]";
export const imzoRadius = "rounded-[1.25rem]";
export const imzoMuted = "text-[#909090]";
export const imzoBody = "text-base leading-[1.4] font-normal text-black";

type Tone = "white" | "grey" | "black";

const grounds: Record<Tone, string> = {
  white: "bg-white text-black",
  grey: `${imzoGrey} text-black`,
  black: "bg-black text-white",
};

/**
 * 630px — the height the page's blocks share on a desktop, and the one the
 * client set. Below `lg` a section is as tall as its content: forcing 630px on
 * a phone would leave a screen and a half of empty ground under two swatches.
 */
const TALL = "lg:flex lg:min-h-[39.375rem] lg:items-center";

export function ImzoSection({
  id,
  tone = "white",
  padded = true,
  contained = true,
  tall = false,
  className,
  children,
}: {
  id: string;
  tone?: Tone;
  /** The reference's `pad-tb-50`. Media sections carry their own height. */
  padded?: boolean;
  contained?: boolean;
  /** Hold 630px on a desktop, with the content centred in it. */
  tall?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(grounds[tone], padded && "py-[3.125rem]", tall && TALL, className)}
    >
      {contained ? <Container>{children}</Container> : children}
    </section>
  );
}

const headingSizes = {
  /** 24px, fixed — every section heading on the reference. */
  section: "text-2xl",
  /** 2.43vw — the dark block. */
  display: "text-[clamp(1.75rem,2.43vw,2.1875rem)]",
  /** 2.68vw — the form. */
  form: "text-[clamp(1.875rem,2.68vw,2.4125rem)]",
  /** 3.08vw — the hero. */
  hero: "text-[clamp(2rem,3.08vw,2.775rem)]",
} as const;

export function ImzoHeading({
  size = "section",
  dark = false,
  className,
  children,
}: {
  size?: keyof typeof headingSizes;
  dark?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <h2
      className={cn(
        // `font-sans` on purpose: the site's headings are Chakra Petch, the
        // reference's are Montserrat like everything else on it.
        "font-sans leading-[1.2] font-bold",
        headingSizes[size],
        dark ? "text-white" : "text-black",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** The heading and the paragraph under it, in the reference's proportions. */
export function ImzoSectionHeader({
  section,
  locale,
  size = "section",
  dark = false,
  className,
  align = "start",
}: {
  section: Pick<ProductSection, "title" | "description">;
  locale: Locale;
  size?: keyof typeof headingSizes;
  dark?: boolean;
  className?: string;
  align?: "start" | "center";
}) {
  const title = localized(section.title, locale);
  const description = localized(section.description, locale);

  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      {title ? (
        <ImzoHeading size={size} dark={dark}>
          {title}
        </ImzoHeading>
      ) : null}

      {description ? (
        <p
          className={cn(
            "mt-5 max-w-[46rem] text-base leading-[1.4]",
            dark ? "text-white/80" : "text-black/70",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

// radius 30px, min-height 48px, 16px/500 — the reference's `.btn.large`.
const pillBase =
  "inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-[1.875rem] border px-9 py-2 text-base leading-[1.4] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const pillTones = {
  black:
    "border-black bg-black text-white hover:bg-white hover:text-black active:bg-white active:text-black focus-visible:ring-black",
  white:
    "border-white bg-white text-black hover:bg-transparent hover:text-white active:bg-transparent active:text-white focus-visible:ring-white focus-visible:ring-offset-black",
  outline:
    "border-black/20 bg-transparent text-black hover:border-black hover:bg-black hover:text-white active:border-black active:bg-black active:text-white focus-visible:ring-black",
} as const;

export type PillTone = keyof typeof pillTones;

export function imzoPill(tone: PillTone, className?: string): string {
  return cn(pillBase, pillTones[tone], className);
}

// The data speaks in roles — primary, outline, light — and this is where a role
// becomes one of the reference's two buttons. `light` is the one that sits on a
// photograph or a black ground.
const actionTones: Record<ProductAction["tone"], PillTone> = {
  primary: "black",
  outline: "outline",
  light: "white",
};

export function ImzoActions({
  actions,
  locale,
  className,
}: {
  actions: ProductAction[] | undefined;
  locale: Locale;
  className?: string;
}) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {actions.map((action) => {
        const label = localized(action.label, locale);
        const classes = imzoPill(actionTones[action.tone]);

        if (isExternalHref(action.href)) {
          return (
            <a key={action.href} href={action.href} className={classes}>
              {label}
            </a>
          );
        }

        return (
          <Link key={action.href} href={action.href} className={classes}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}
