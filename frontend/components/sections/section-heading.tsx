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
      <p
        className={cn(
          "font-heading text-sm font-semibold tracking-[0.24em] uppercase",
          tone === "dark" ? "text-brand-red" : "text-brand-red",
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
