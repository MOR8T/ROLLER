import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Renders the `<accent>` tag in a rich message as the single red word DESIGN.md
 * §9 allows in an H2. Pass it to `t.rich`:
 *
 *   t.rich("title", { accent: accentTag })
 *
 * Marking up the accent inside the message rather than splitting the string in
 * JSX lets each translation choose which of its own words carries the red — the
 * emphasised word sits in a different position in every language.
 *
 * The `key` is required, not decorative: `t.rich` returns an array of chunks
 * (text, element, text), and React warns about a keyless list without it. Our
 * messages carry exactly one `<accent>` per title, so a constant key is safe.
 */
export const accentTag = (chunks: ReactNode) => (
  <span key="accent" className="text-brand-red">
    {chunks}
  </span>
);

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
}: {
  eyebrow: string;
  title: string | ReactNode;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center")}>
      {/* Eyebrows are deliberately not red. DESIGN.md §9 bans small red text on
          white, and this is the most persistent small text on the page. Red is
          kept for the one accented word in the H2 below, where the type is
          large enough to carry it. */}
      <p
        className={cn(
          "font-heading text-sm font-semibold tracking-[0.24em] uppercase",
          tone === "dark" ? "text-brand-white/60" : "text-brand-black/55",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 text-3xl font-bold tracking-tight sm:text-4xl",
          tone === "dark" ? "text-brand-white" : "text-brand-black",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-7",
            tone === "dark" ? "text-brand-white/65" : "text-brand-black/65",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
