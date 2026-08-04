import { cn } from "@/lib/utils";

type BadgeVariant = "red" | "black" | "outline";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/**
 * Badge component for product class labels.
 * - red: Brand red background with white text (default)
 * - black: Brand black background with white text
 * - outline: Transparent with subtle border and black text
 *
 * `rounded-control`, not `rounded-full` — DESIGN.md §5 reserves pills for
 * avatars, dot indicators and circular icon buttons. A text badge is none of
 * those, and pill badges reintroduce the soft look the brandbook rejects.
 */
export function Badge({ variant = "red", className, ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-control px-3 py-1 text-xs font-semibold transition-colors";

  const variantStyles: Record<BadgeVariant, string> = {
    red: "bg-brand-red text-brand-white",
    black: "bg-brand-black text-brand-white",
    outline: "border border-neutral-300 bg-transparent text-brand-black",
  };

  return <span className={cn(baseStyles, variantStyles[variant], className)} {...props} />;
}
