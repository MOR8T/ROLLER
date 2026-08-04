import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { projectTeasers } from "@/data/home";
import { cn } from "@/lib/utils";
import type { ProjectTeaser } from "@/types";

function ProjectTile({
  project,
  sizes,
  featured = false,
}: {
  project: ProjectTeaser;
  sizes: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={project.href}
      className={cn(
        "group relative block overflow-hidden rounded-card border border-brand-black/8 bg-neutral-50 text-brand-black focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
        featured ? "h-full min-h-[28rem] sm:min-h-[32rem]" : "h-full min-h-64 sm:min-h-72",
      )}
      aria-label={`${project.title}, ${project.location}`}
    >
      <div className="absolute inset-0">
        <MediaFrame
          src={project.image}
          alt={project.title}
          fill
          sizes={sizes}
          containerClassName="h-full w-full bg-neutral-50"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(247,247,247,0.05)_0%,rgba(247,247,247,0.4)_45%,rgba(247,247,247,0.95)_100%)]" />

      <div
        className={cn(
          "relative flex h-full flex-col justify-between",
          featured ? "p-6 sm:p-8 lg:p-10" : "p-5 sm:p-6",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-control border border-brand-black/15 bg-brand-white/70 px-3 py-1 text-xs font-semibold text-brand-black backdrop-blur-sm">
              {project.location}
            </span>
            <span className="rounded-control border border-brand-black/12 px-3 py-1 text-xs font-medium text-brand-black/70 backdrop-blur-sm">
              {project.category}
            </span>
          </div>
          <ArrowUpRight className="size-6 shrink-0 text-brand-black/70 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-black sm:size-7" />
        </div>

        <div>
          <h3
            className={cn(
              "font-heading font-bold tracking-tight text-brand-black",
              featured ? "text-3xl sm:text-4xl lg:text-5xl" : "text-xl sm:text-2xl",
            )}
          >
            {project.title}
          </h3>
          <p
            className={cn(
              "mt-2 text-brand-black/70",
              featured
                ? "max-w-md text-sm leading-6 sm:text-base sm:leading-7"
                : "text-sm leading-6",
            )}
          >
            {project.caption}
          </p>
          {featured ? (
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-black">
              Смотреть кейс
              <ArrowRight className="size-4 text-brand-red transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function ProjectsSection() {
  const [featured, ...rest] = projectTeasers;
  const sideProjects = rest.slice(0, 2);
  const bottomProjects = rest.slice(2);

  return (
    <Section id="projects">
      <Container>
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Объекты"
            title="Что мы уже остеклили"
            description="Короткий срез объектов до запуска полного портфолио."
          />

          <Link
            href="/portfolio"
            className="inline-flex w-fit items-center gap-2 rounded-control bg-brand-black px-5 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Открыть портфолио
            <ArrowRight className="size-4" />
          </Link>
        </Reveal>

        <div className="mt-10">
          <RevealGroup className="grid gap-4 sm:gap-5 lg:grid-cols-12 lg:grid-rows-2 lg:gap-5">
            <RevealItem className="h-full lg:col-span-7 lg:row-span-2">
              <ProjectTile project={featured} featured sizes="(max-width: 1024px) 100vw, 58vw" />
            </RevealItem>

            {sideProjects.map((project) => (
              <RevealItem key={project.id} className="h-full lg:col-span-5">
                <ProjectTile project={project} sizes="(max-width: 1024px) 100vw, 42vw" />
              </RevealItem>
            ))}
          </RevealGroup>

          {bottomProjects.length > 0 ? (
            <RevealGroup className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 md:grid-cols-2">
              {bottomProjects.map((project) => (
                <RevealItem key={project.id} className="h-full">
                  <ProjectTile project={project} sizes="(max-width: 768px) 100vw, 50vw" />
                </RevealItem>
              ))}
            </RevealGroup>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
