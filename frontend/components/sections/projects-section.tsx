import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { projectTeasers } from "@/data/home";
import type { ProjectTeaser } from "@/types";

function ProjectCard({ project, sizes }: { project: ProjectTeaser; sizes: string }) {
  return (
    <Card
      variant="elevated"
      className="group flex h-full flex-col overflow-hidden rounded-4xl border border-brand-black/10 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-black/10"
    >
      <div className="relative aspect-4/3 bg-brand-black">
        <MediaFrame
          src={project.image}
          alt={project.title}
          fill
          sizes={sizes}
          containerClassName="h-full w-full bg-brand-black"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-brand-black/55 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-semibold text-brand-red">
            {project.location}
          </span>
          <span className="rounded-full border border-brand-black/10 px-3 py-1 text-xs font-semibold text-brand-black/62">
            {project.category}
          </span>
        </div>

        <h3 className="mt-4 font-heading text-2xl font-bold tracking-tight text-brand-black">
          {project.title}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-6 text-brand-black/68">{project.caption}</p>

        <Link
          href={project.href}
          className="mt-6 inline-flex w-fit items-center gap-2 rounded-md py-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Смотреть кейс в портфолио
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Card>
  );
}

export function ProjectsSection() {
  return (
    <Section id="projects" className="bg-neutral-50">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Реализованные проекты"
            title="Короткий срез объектов до запуска полного портфолио"
            // description="Показываем типы объектов, географию и характер решений, чтобы клиент быстро понял масштаб и релевантность нашего опыта."
          />

          <div className="flex flex-col items-start gap-3 lg:items-end">
            {/* <p className="max-w-sm text-sm leading-6 text-brand-black/62">
              Пока это подборка ключевых кейсов. Полная галерея объектов и детали по каждому проекту
              будут доступны на отдельной странице.
            </p> */}
            <Link
              href="/portfolio"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-black px-5 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Открыть портфолио
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <Reveal preset="stagger" className="mt-10">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {projectTeasers.map((project) => (
              <RevealItem key={project.id}>
                <ProjectCard
                  project={project}
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
              </RevealItem>
            ))}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
