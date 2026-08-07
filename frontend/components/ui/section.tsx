import { cn } from "@/lib/utils";

/**
 * Section tone — the semantic background scale from DESIGN.md §3.
 *
 * `inverse` is not a decorative option: a dark background marks a change of
 * audience from private client to professional, and the homepage uses it in
 * exactly one place ("Профессионалам"). The footer is the only other dark
 * surface on the site.
 */
type SectionTone = "surface" | "muted" | "inverse";

const tones: Record<SectionTone, string> = {
  surface: "bg-surface text-brand-black",
  muted: "bg-surface-muted text-brand-black",
  inverse: "bg-surface-inverse text-brand-white",
};

interface SectionProps extends React.ComponentProps<"section"> {
  tone?: SectionTone;
}

export function Section({ tone = "surface", className, children, ...props }: SectionProps) {
  return (
    <section className={cn("py-section", tones[tone], className)} {...props}>
      {children}
    </section>
  );
}
