import { partners } from "@/data/home";
import { cn } from "@/lib/utils";
import Image from "next/image";

/**
 * The suppliers' marks: Krauss Maffei, Renolit, Mikrosan, Akdeniz and the rest
 * (brief §7.4). Shown on the homepage's production block and on `/about`.
 *
 * The logos are inline SVG strings in `data/home.ts`, hence the
 * `dangerouslySetInnerHTML` — they are our own build-time constants, not
 * anything a user or an API supplies. A partner without a mark falls back to
 * its name set in type, exactly like the two aluminium brands do in the
 * catalog.
 */
export function PartnersGrid({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-3 md:grid-cols-4", className)}>
      {partners.map((partner) => {
        const logo = partner.logo;

        return (
          <li
            key={partner.name}
            className="flex min-h-24 items-center justify-center overflow-hidden rounded-card border border-brand-black/10 bg-surface p-4"
          >
            {logo ? (
              // <span
              //   className="flex w-full items-center justify-center [&_svg]:h-12 [&_svg]:w-full [&_svg]:max-w-[160px]"
              //   aria-label={partner.name}
              //   role="img"
              //   dangerouslySetInnerHTML={{ __html: partner.logo ?? "" }}
              // />
              <img width={200} height={100} src={logo} alt={partner.name} />
            ) : (
              <span className="text-center font-heading text-sm font-semibold text-brand-black/70">
                {partner.name}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
