import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { advantages } from "@/data/home";

// Optional supporting imagery — a single production/quality shot anchors the
// narrative without competing with the cards. Swap for a dedicated shot once
// the client delivers one.
const SUPPORTING_IMAGE = "/hero/hero-main.png";

export function AdvantagesSection() {
  return (
    <Section id="advantages" className="bg-brand-white">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <Reveal preset="fade-up" className="lg:sticky lg:top-24 lg:self-start">
            <SectionHeading
              eyebrow="Преимущества"
              title="От замера до сервиса — один ответственный производитель"
              // description="Сохраняем индустриальный характер референсов IMZO и AKFA, но подаём чище: крупная типографика, чёткие карточки и понятные обязательства перед клиентом."
            />
            <div className="mt-8 hidden overflow-hidden rounded-3xl border border-brand-black/10 shadow-[0_30px_80px_-50px_rgba(29,29,27,0.45)] lg:block">
              <MediaFrame
                src={SUPPORTING_IMAGE}
                alt="Производство профильных систем ROLLER"
                width={520}
                height={360}
                sizes="40vw"
                containerClassName="rounded-3xl"
                className="object-cover"
              />
            </div>
          </Reveal>

          <Reveal preset="stagger" className="grid gap-4 sm:grid-cols-2 lg:gap-5">
            {advantages.map((advantage, index) => (
              <RevealItem
                key={advantage.title}
                className="group relative flex h-full flex-col rounded-3xl border border-brand-black/10 bg-neutral-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-red/30 hover:bg-brand-white hover:shadow-[0_24px_60px_-40px_rgba(29,29,27,0.35)]"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="rounded-2xl bg-brand-red/10 p-3 text-brand-red transition-colors duration-300 group-hover:bg-brand-red group-hover:text-brand-white">
                    <advantage.icon className="size-6" />
                  </div>
                  <span className="font-heading text-sm font-semibold text-brand-black/30 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-6 font-heading text-xl font-semibold text-brand-black">
                  {advantage.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-brand-black/65">
                  {advantage.description}
                </p>
                <span className="mt-5 h-px w-12 bg-brand-red/40 transition-all duration-300 group-hover:w-20 group-hover:bg-brand-red" />
              </RevealItem>
            ))}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
