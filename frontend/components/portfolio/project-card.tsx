import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";

import { MediaFrame } from "@/components/ui/media-frame";
import { Link } from "@/i18n/navigation";
import { projectHref, type ProjectRecord } from "@/data/portfolio";

/**
 * A portfolio object in the grid: photo, title, city, what was installed and
 * the volume — the four facts `project_plan/07-secondary-pages.md` asks for.
 *
 * The homepage keeps its own editorial tiles (`ProjectsSection`), which are a
 * different composition — one large, four small. This card is the uniform one.
 */
export function ProjectCard({ project }: { project: ProjectRecord }) {
  const t = useTranslations("projects");

  const title = t(`items.${project.id}.title`);
  const location = t(`items.${project.id}.location`);

  return (
    <article className="group h-full">
      <Link
        href={projectHref(project.slug)}
        className="flex h-full flex-col overflow-hidden rounded-card border border-brand-black/10 bg-surface transition-colors hover:border-brand-red/30 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={t("cardAria", { title, location })}
      >
        <MediaFrame
          src={project.image}
          alt={title}
          width={800}
          height={560}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          containerClassName="rounded-none border-0"
          className="transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-brand-black/55">
            <span>{location}</span>
            <span aria-hidden>·</span>
            <span>{t(`categories.${project.category}`)}</span>
            <span aria-hidden>·</span>
            <span>{project.year}</span>
          </div>

          <h3 className="mt-3 font-heading text-xl font-bold tracking-tight text-brand-black">
            {title}
          </h3>

          <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/65">
            {t(`items.${project.id}.caption`)}
          </p>

          <dl className="mt-5 space-y-2 border-t border-brand-black/8 pt-5 text-sm leading-6">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-brand-black/55">{t("facts.installed")}</dt>
              <dd className="text-right font-semibold text-brand-black">
                {t(`items.${project.id}.installed`)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-brand-black/55">{t("facts.volume")}</dt>
              <dd className="text-right font-semibold text-brand-black">
                {t(`items.${project.id}.volume`)}
              </dd>
            </div>
          </dl>

          <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red">
            {t("viewCase")}
            <ArrowUpRight className="size-4 shrink-0" aria-hidden />
          </span>
        </div>
      </Link>
    </article>
  );
}
