import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { advantages } from "@/data/home";

export function AdvantagesSection() {
  return (
    <Section className="bg-brand-black text-brand-white">
      <Container>
        <SectionHeading
          eyebrow="Преимущества"
          title="От замера до сервиса — один ответственный производитель"
          description="Мы сохраняем индустриальный характер референсов IMZO и AKFA, но делаем подачу чище: крупная типографика, чёткие карточки и понятные преимущества."
          tone="dark"
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {advantages.map((advantage, index) => (
            <div
              key={advantage.title}
              className="group rounded-3xl border border-brand-white/10 bg-brand-white/[0.06] p-5 transition-colors hover:bg-brand-white/[0.1]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="rounded-2xl bg-brand-red/15 p-3 text-brand-red">
                  <advantage.icon className="size-6" />
                </div>
                <span className="font-heading text-sm text-brand-white/30">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-6 font-heading text-xl font-semibold">{advantage.title}</h3>
              <p className="mt-3 text-sm leading-6 text-brand-white/62">{advantage.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
