import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A system's brand mark — its logo, or its name set in type when it has none.
 *
 * The two aluminium systems (АЛД-45, ТЕРМО 60) have no logo of their own, and
 * DESIGN.md §7 requires a card to work identically either way. The fixed height
 * is what enforces that: both branches occupy the same box, so a row of cards
 * lines up whether or not a logo exists.
 */
export function BrandMark({
  logo,
  name,
  className,
}: {
  logo: string | null;
  name: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-9 items-center", className)}>
      {logo ? (
        <Image
          src={logo}
          alt={name}
          width={160}
          height={36}
          className="h-full w-auto object-contain object-left"
        />
      ) : (
        <span className="font-heading text-2xl font-bold tracking-tight text-brand-black">
          {name}
        </span>
      )}
    </div>
  );
}
