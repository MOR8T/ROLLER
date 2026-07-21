import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { productCategories } from "@/data/home";

export function CategoriesSection() {
  return (
    <Section id="categories">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Каталог"
            title="Две ключевые категории продукции"
            description="Структура каталога простая: отдельно ПВХ-системы для тепла и практичности, отдельно алюминиевые решения для больших проёмов, фасадов и входных групп."
          />
          <Link
            href="/catalog"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-black/15 px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-red hover:text-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Весь каталог
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <Reveal preset="stagger" className="mt-10 grid gap-5 sm:gap-6 lg:grid-cols-2">
          {productCategories.map((category) => (
            <RevealItem key={category.title}>
              <Link
                href={category.href}
                className="group relative block min-h-80 overflow-hidden rounded-4xl bg-brand-black text-brand-white shadow-sm transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <div className="absolute inset-0">
                  <MediaFrame
                    src={category.image}
                    alt={category.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    containerClassName="bg-brand-black"
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(29,29,27,0.30)_0%,rgba(29,29,27,0.55)_50%,rgba(29,29,27,0.92)_100%)]" />
                <div className="relative flex min-h-80 flex-col justify-between p-6 sm:p-8 lg:p-10">
                  <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-brand-white/20 bg-brand-white/8 px-3 py-1.5 text-xs font-medium tracking-[0.18em] text-brand-white/80 uppercase backdrop-blur-md">
                      <span className={`size-2 rounded-full ${category.accent}`} />
                      {category.eyebrow}
                    </span>
                    <ArrowUpRight className="size-7 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 sm:size-8" />
                  </div>
                  <div>
                    <p className="font-heading text-3xl font-bold sm:text-4xl lg:text-5xl">
                      {category.title}
                    </p>
                    <p className="mt-3 max-w-md text-sm leading-6 text-brand-white/75 sm:text-base sm:leading-7">
                      {category.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-white">
                      Смотреть категорию
                      <ArrowUpRight className="size-4 text-brand-red transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </RevealItem>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
