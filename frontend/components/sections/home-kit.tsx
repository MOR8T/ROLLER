import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Link } from "@/i18n/navigation";
import { cn, isExternalHref } from "@/lib/utils";

/**
 * The homepage's own shape language.
 *
 * ⚠️ This file deliberately departs from the rest of the site, at the client's
 * request on 2026-08-13: the homepage is to read like imzo.uz — quiet,
 * monochrome, and short of words — while every other page keeps the system in
 * `components/ui/`. Three differences, and they are the whole of it:
 *
 *   1. **Pills.** `rounded-full` on actions and `rounded-[1.75rem]` on cards.
 *      DESIGN.md §5 rules pills out because they fight the sharp logo; that
 *      rule still governs `Button`, which is why this is a separate set of
 *      classes rather than a new `variant` on it. Nothing outside the homepage
 *      may import from here.
 *
 *   2. **Black, not red.** Red survives on the homepage in exactly two places —
 *      the mark in the header and the date on a news card. Everything that used
 *      to be red here is black now. A page with one accent reads calm; a page
 *      with an accent on every button reads like a sale.
 *
 *   3. **No eyebrow, no deck.** A section is a heading and the thing itself.
 *      The explanatory paragraph under every heading was the bulk of the text
 *      the client asked to remove, and the catalog, `/about` and `/solutions`
 *      all still carry that copy where a visitor has actually asked for it.
 */

/** Cards and media on the homepage. Pills are `rounded-full` inline. */
export const homeCard = "rounded-[1.75rem]";

export function HomeSection({
  id,
  tone = "surface",
  className,
  children,
}: {
  id?: string;
  tone?: "surface" | "muted";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      // Roomier than `py-section`: the air is what does the work once the words
      // are gone.
      //
      // Neither tone is opaque. The homepage carries a brand-mark watermark
      // down its right edge (see `page.tsx`), and a solid `bg-brand-white`
      // would paint straight over it — so `surface` contributes no background
      // at all and lets the page's own white through, while `muted` is a wash
      // rather than a fill and dims the mark instead of hiding it.
      className={cn(
        "py-[clamp(4rem,8vw,7rem)]",
        tone === "muted" ? "bg-neutral-50/75" : "bg-transparent",
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

/**
 * A heading and, optionally, the one link that belongs beside it. No eyebrow
 * and no description — see the note at the top of the file.
 *
 * `control` is for a section whose heading row carries an input as well as the
 * link — the city picker in `ShowroomsSection` is the only one. It sits on the
 * left of the action so the pair reads "choose, then go", and it exists as a
 * slot rather than as its own copy of the `<h2>` classes so that the homepage
 * keeps one heading size in one file.
 */
export function HomeHeading({
  title,
  action,
  control,
  className,
}: {
  title: string;
  action?: { label: string; href: string };
  control?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10",
        className,
      )}
    >
      <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-brand-black sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
        {title}
      </h2>

      {control || action ? (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {control}

          {action ? (
            <PillLink href={action.href}>
              {action.label}
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </PillLink>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const pillBase =
  "inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

const pillTones = {
  dark: "bg-brand-black text-brand-white hover:bg-brand-black/85",
  light: "border border-brand-black/15 bg-brand-white text-brand-black hover:border-brand-black/45",
  /** On a photograph — the hero deck. */
  white:
    "bg-brand-white text-brand-black hover:bg-brand-white/85 focus-visible:ring-brand-white focus-visible:ring-offset-brand-black",
} as const;

export function pillClass(tone: keyof typeof pillTones = "dark", className?: string) {
  return cn(pillBase, pillTones[tone], className);
}

/**
 * `cn` is a plain join, not `tailwind-merge` — two competing `rounded-*` on one
 * element would be settled by stylesheet order, not by class order. So the pill
 * is its own set of classes rather than a `className` override on `Button`, and
 * the external/internal split is repeated from `ButtonLink` rather than
 * inherited: a locale-prefixed `#products` navigates away from the page instead
 * of scrolling down it.
 */
export function PillLink({
  href,
  tone = "dark",
  className,
  children,
  ...props
}: {
  href: string;
  tone?: keyof typeof pillTones;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentProps<"a">, "href" | "className" | "children">) {
  const classes = pillClass(tone, className);

  if (isExternalHref(href)) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
