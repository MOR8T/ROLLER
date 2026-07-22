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
 */
export function Badge({ variant = "red", className, ...props }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors";

  const variantStyles: Record<BadgeVariant, string> = {
    red: "bg-brand-red text-brand-white",
    black: "bg-brand-black text-brand-white",
    outline: "border border-neutral-300 bg-transparent text-brand-white",
  };

  return <span className={cn(baseStyles, variantStyles[variant], className)} {...props} />;
}
