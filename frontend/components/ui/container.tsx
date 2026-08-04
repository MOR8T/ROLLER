import { cn } from "@/lib/utils";

/**
 * The site's only container. One width, one gutter — sections must not add
 * horizontal padding of their own (DESIGN.md §5). Both values come from
 * `--container-page` / `--spacing-gutter` in globals.css.
 */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mx-auto w-full max-w-page px-gutter", className)}>{children}</div>;
}
