import { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
