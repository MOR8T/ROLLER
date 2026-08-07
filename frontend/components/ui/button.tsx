import { Link } from "@/i18n/navigation";
import { cn, isExternalHref } from "@/lib/utils";

// `outline-inverse` is the dark-ground half of the pair required by DESIGN.md
// §9. Primary needs no inverse: brand red reads on both grounds.
type Variant = "primary" | "outline" | "outline-inverse" | "ghost";
type Size = "sm" | "md" | "lg";

// `rounded-control` (8px), never `rounded-full` — pill buttons fight the sharp,
// geometric logo. See DESIGN.md §5.
const base =
  "inline-flex items-center justify-center gap-2 rounded-control text-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-brand-red text-brand-white hover:bg-brand-red/90",
  outline: "border border-brand-black/20 bg-transparent text-brand-black hover:bg-brand-black/5",
  "outline-inverse":
    "border border-brand-white/30 bg-transparent text-brand-white hover:bg-brand-white/10 focus-visible:ring-offset-brand-black",
  ghost: "bg-transparent text-brand-black hover:bg-brand-black/5",
};

// `min-h`, not `h`. A fixed height clips the label the moment it wraps, and
// Tajik runs 10–20% longer than Russian while Turkish compounds ("Fiyat
// listesi isteyin") wrap on narrow columns — DESIGN.md §10 rules out fixed
// widths under text, and a fixed height is the same mistake on the other axis.
const sizes: Record<Size, string> = {
  sm: "min-h-9 px-4 py-2 text-sm",
  md: "min-h-11 px-6 py-2.5 text-sm",
  lg: "min-h-14 px-8 py-3 text-base",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

interface ButtonLinkProps extends Omit<React.ComponentProps<"a">, "href"> {
  href: string;
  variant?: Variant;
  size?: Size;
}

/**
 * Internal targets go through the locale-aware `Link`; external ones and
 * same-page fragments stay on a plain `<a>`, which is what they need — a
 * fragment prefixed with `/ru` would navigate away from the page instead of
 * scrolling down it.
 */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: ButtonLinkProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (isExternalHref(href)) {
    return <a href={href} className={classes} {...props} />;
  }

  return <Link href={href} className={classes} {...props} />;
}
