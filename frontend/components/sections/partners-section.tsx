import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { partners } from "@/data/home";

export function PartnersSection() {
  return (
    <Section className="bg-neutral-50">
      <Container>
        <SectionHeading
          eyebrow="Доверие"
          title="Материалы и технологии от проверенных поставщиков"
          description="Партнёрский блок пока собран текстовыми логотипами. После получения бренд-материалов его можно заменить на реальные SVG/изображения."
          align="center"
        />

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {partners.map((partner) => (
            <div
              key={partner}
              className="flex min-h-24 items-center justify-center rounded-3xl border border-brand-black/10 bg-brand-white px-4 text-center font-heading text-lg font-semibold text-brand-black/72 shadow-sm transition-colors hover:border-brand-red hover:text-brand-red"
            >
              {partner}
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
