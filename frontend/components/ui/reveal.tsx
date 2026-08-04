import { cn } from "@/lib/utils";

/**
 * Scroll reveal — DESIGN.md §8.
 *
 * These are plain server components: the whole effect lives in CSS
 * (`animation-timeline: view()`, see globals.css), so revealing content costs
 * no JavaScript and does not force a section to become a client component.
 *
 * Two levels, and nothing else animates:
 *   `Reveal`      — structural sections. Opacity only, no offset.
 *   `RevealGroup` — a grid of cards. Short stagger, 12px offset, applied by
 *                   the CSS to each direct child.
 *
 * `prefers-reduced-motion` and browsers without scroll-driven animations both
 * fall back to "content is simply visible" — handled by the CSS guards.
 */

type DivProps = React.ComponentProps<"div">;

export function Reveal({ className, ...props }: DivProps) {
  return <div className={cn("reveal", className)} {...props} />;
}

export function RevealGroup({ className, ...props }: DivProps) {
  return <div className={cn("reveal-group", className)} {...props} />;
}

/**
 * A direct child of `RevealGroup`. It carries no animation classes of its own —
 * the group's CSS targets `> *` — but keeping it as a component preserves the
 * wrapper element that grid layouts rely on (`h-full`, column spans).
 */
export function RevealItem({ className, ...props }: DivProps) {
  return <div className={cn(className)} {...props} />;
}
