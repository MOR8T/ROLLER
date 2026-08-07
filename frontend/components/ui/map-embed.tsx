import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * The Yandex map of the office (brief §15.9).
 *
 * Square corners: it is a large media block, and DESIGN.md §5 keeps those
 * unrounded. `loading="lazy"` matters more here than anywhere else on the site
 * — a map iframe is the heaviest thing on a contact page and none of it is
 * needed above the fold.
 */
export function MapEmbed({ title, className }: { title: string; className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-brand-black/10 bg-neutral-50",
        className,
      )}
    >
      <iframe
        title={title}
        src={siteConfig.mapEmbedUrl}
        className="h-full min-h-80 w-full border-0"
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
