import type { ReactNode } from "react";

import { Breadcrumbs, type Crumb } from "@/components/products/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

/**
 * The opening block of every inner page — catalog, category, application
 * landing, and since stage 07 the content pages too: trail, eyebrow, the page's
 * single `<h1>` and a lead paragraph.
 *
 * The `<h1>` lives here rather than in `SectionHeading`, which renders an `<h2>`
 * for section titles — one per page is the rule in DESIGN.md §4, and on these
 * pages it is the SEO-bearing line ("Пластиковые окна в Душанбе").
 */
export function PageHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  tone = "light",
  children,
}: {
  breadcrumbs: Crumb[];
  /**
   * Optional since 2026-08-16: `/showroom` was rebuilt against imzo.uz, whose
   * page opens on the heading itself. Every other caller still passes one, so
   * the eyebrow remains the norm rather than the exception.
   */
  eyebrow?: string;
  title: string;
  description: string;
  /** `dark` is for the one dark page on the site — «Профессионалам». */
  tone?: "light" | "dark";
  children?: ReactNode;
}) {
  const dark = tone === "dark";

  return (
    <Container>
      <Breadcrumbs items={breadcrumbs} tone={tone} />

      <Reveal className="mt-8 mb-8 max-w-3xl">
        {eyebrow ? (
          <p
            className={cn(
              "font-heading text-sm font-semibold tracking-[0.24em] uppercase",
              dark ? "text-brand-white/60" : "text-brand-black/55",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={cn(
            "text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl",
            eyebrow && "mt-3",
            dark ? "text-brand-white" : "text-brand-black",
          )}
        >
          {title}
        </h1>
        <p
          className={cn(
            "mt-5 text-base leading-7",
            dark ? "text-brand-white/70" : "text-brand-black/65",
          )}
        >
          {description}
        </p>
        {children}
      </Reveal>
    </Container>
  );
}
