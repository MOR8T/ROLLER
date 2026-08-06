import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { MediaFrame } from "@/components/ui/media-frame";
import { Link } from "@/i18n/navigation";
import { applicationHref, type ApplicationBase } from "@/data/catalog";

/**
 * An application as an entry point — the card on the homepage and on
 * `/catalog`, linking to the SEO landing at `/solutions/[slug]`.
 *
 * The image slot is a nullable data field, not a hardcoded path: context-layer
 * photography does not exist yet and arrives through the admin panel without a
 * code change (DESIGN.md §6 п.2). Until then `MediaFrame` renders its neutral
 * placeholder.
 */
export function ApplicationCard({ application }: { application: ApplicationBase }) {
  const t = useTranslations("applications");
  const title = t(`items.${application.slug}.title`);

  return (
    <Link
      href={applicationHref(application.slug)}
      className="group flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/40 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <MediaFrame
        src={application.image}
        alt={title}
        // The title is interpolated as written. It used to be lowercased in
        // code, which is unsafe once Turkish is in scope: `toLowerCase()` turns
        // "İ" into "i̇" and "I" into "i" rather than "ı".
        placeholderLabel={t("imagePlaceholder", { title })}
        width={420}
        height={300}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        containerClassName="rounded-none border-0"
      />

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-heading text-xl font-semibold text-brand-black">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/70">
          {t(`items.${application.slug}.description`)}
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
          {t("cta")}
          <ArrowUpRight className="size-4 shrink-0" />
        </span>
      </div>
    </Link>
  );
}
