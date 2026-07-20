import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { popularProducts } from "@/data/home";

export function ProductsSection() {
  return (
    <Section>
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            eyebrow="Популярные системы"
            title="Системы для разных задач и бюджетов"
            description="Карточки без цен: на этом этапе показываем направление ассортимента, классы систем и сценарии применения."
          />
          <Link
            href="/catalog"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-black px-5 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-red"
          >
            Смотреть системы
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {popularProducts.map((product) => (
            <article
              key={product.name}
              className="group overflow-hidden rounded-[1.75rem] border border-brand-black/10 bg-brand-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-black/10"
            >
              <div className="relative h-48 bg-neutral-100">
                <div className="absolute inset-5 rounded-[1.25rem] border border-brand-black/10 bg-[linear-gradient(135deg,rgba(211,0,26,0.14),rgba(29,29,27,0.08)),linear-gradient(90deg,rgba(255,255,255,0.7)_0_18%,transparent_18%_28%,rgba(255,255,255,0.45)_28%_46%,transparent_46%)]" />
                <span className="absolute top-5 left-5 rounded-full bg-brand-red px-3 py-1 text-xs font-semibold text-brand-white">
                  {product.badge}
                </span>
              </div>
              <div className="p-6">
                <p className="text-sm font-semibold text-brand-red">{product.type}</p>
                <h3 className="mt-2 font-heading text-3xl font-bold">{product.name}</h3>
                <p className="mt-3 text-sm leading-6 text-brand-black/62">{product.description}</p>
                <Link
                  href="/catalog"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-black transition-colors group-hover:text-brand-red"
                >
                  Подробнее
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </Section>
  );
}
