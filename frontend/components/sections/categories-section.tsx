import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { productCategories } from "@/data/home";

export function CategoriesSection() {
  return (
    <Section>
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Каталог"
            title="Две ключевые категории продукции"
            description="Структура каталога простая: отдельно ПВХ-системы для тепла и практичности, отдельно алюминиевые решения для больших проёмов, фасадов и входных групп."
          />
          <Link
            href="/catalog"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-black/15 px-5 py-3 text-sm font-semibold transition-colors hover:border-brand-red hover:text-brand-red"
          >
            Весь каталог
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {productCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group relative min-h-80 overflow-hidden rounded-[2rem] bg-brand-black p-8 text-brand-white shadow-sm transition-transform duration-300 hover:-translate-y-1"
            >
              <div
                className={`absolute top-0 right-0 h-40 w-40 rounded-bl-[5rem] opacity-90 ${category.accent}`}
              />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0_1px,transparent_1px_34px)] opacity-40" />
              <div className="relative flex h-full flex-col justify-between">
                <ArrowUpRight className="ml-auto size-8 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                <div>
                  <p className="font-heading text-4xl font-bold">{category.title}</p>
                  <p className="mt-4 max-w-md leading-7 text-brand-white/70">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </Section>
  );
}
