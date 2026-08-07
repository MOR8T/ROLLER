import type { ReactNode } from "react";

import { Breadcrumbs, type Crumb } from "@/components/catalog/breadcrumbs";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

/**
 * The opening block of `/catalog`, a category page and an application landing:
 * trail, eyebrow, the page's single `<h1>` and a lead paragraph.
 *
 * The `<h1>` lives here rather than in `SectionHeading`, which renders an `<h2>`
 * for section titles — one per page is the rule in DESIGN.md §4, and on these
 * pages it is the SEO-bearing line ("Пластиковые окна в Душанбе").
 */
export function CatalogPageHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  children,
}: {
  breadcrumbs: Crumb[];
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <Container>
      <Breadcrumbs items={breadcrumbs} />

      <Reveal className="mt-8 max-w-3xl">
        <p className="font-heading text-sm font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-brand-black sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-base leading-7 text-brand-black/65">{description}</p>
        {children}
      </Reveal>
    </Container>
  );
}
