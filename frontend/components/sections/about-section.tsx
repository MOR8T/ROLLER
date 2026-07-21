import { ArrowRight, Factory, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { siteConfig } from "@/lib/site-config";

// NOTE: No dedicated company/production photo is available yet.
// `/hero/hero-main.png` is the best production-shot we have; swap for a real
// factory/office photo once the client delivers one.
const ABOUT_PHOTO = "/hero/hero-main.png";

const HIGHLIGHTS = [
  {
    value: "20",
    suffix: "лет",
    label: "на рынке Таджикистана — от первой линии до сегодняшних объектов",
  },
  {
    value: "Full",
    suffix: "cycle",
    label: "от консультации и замера до производства, монтажа и сервиса",
  },
  {
    value: "2006",
    suffix: "",
    label: "год основания компании ROLLER",
  },
] as const;

export function AboutSection() {
  const years = new Date().getFullYear() - siteConfig.foundedYear;

  return (
    <Section id="about" className="bg-brand-white">
      <Container className="grid items-center gap-8 md:gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <Reveal preset="fade-up" className="relative">
          <div className="relative">
            <MediaFrame
              src={ABOUT_PHOTO}
              alt="Производство профильных систем ROLLER"
              width={720}
              height={560}
              sizes="(max-width: 1024px) 100vw, 45vw"
              containerClassName="rounded-[2rem] border border-brand-black/10 shadow-[0_30px_80px_-40px_rgba(29,29,27,0.45)]"
              className="object-cover"
            />
            <div className="absolute right-0 -bottom-6 max-w-xs rounded-2xl bg-brand-black p-3 text-brand-white shadow-xl sm:right-6 sm:rounded-3xl sm:p-4 md:p-5">
              <Factory className="size-5 text-brand-red sm:size-6 md:size-7" />
              <p className="mt-2 font-heading text-2xl font-bold text-brand-white sm:mt-3 sm:text-3xl md:text-4xl">
                {years}
              </p>
              <p className="mt-1 text-xs leading-5 font-medium text-brand-white/75 sm:text-sm sm:leading-6">
                лет собственного производства профильных систем
              </p>
            </div>
          </div>
        </Reveal>

        <div>
          <Reveal preset="stagger">
            <RevealItem>
              <SectionHeading
                eyebrow="О компании"
                title={
                  <>
                    <span className="text-brand-red">ROL</span>
                    <span className="text-brand-black">LER</span>
                    {" — профильные решения для домов и бизнеса"}
                  </>
                }
                description="Развиваем собственное производство ПВХ и алюминиевых систем в Таджикистане. Клиент получает не просто изделие, а готовое решение: консультация, замер, производство, доставка, монтаж и обслуживание в одном процессе."
              />
            </RevealItem>

            <RevealItem className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-4 md:gap-5">
              {HIGHLIGHTS.map((highlight) => (
                <div
                  key={highlight.value}
                  className="rounded-lg border border-brand-black/10 bg-neutral-50 p-3 sm:rounded-2xl sm:p-4 md:p-5"
                >
                  <p className="font-heading text-xl font-bold text-brand-red sm:text-2xl md:text-3xl">
                    {highlight.value}
                    {highlight.suffix ? (
                      <span className="ml-1 text-xs font-semibold text-brand-black/70 sm:text-sm">
                        {highlight.suffix}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-brand-black/65 sm:text-sm sm:leading-6">
                    {highlight.label}
                  </p>
                </div>
              ))}
            </RevealItem>

            <RevealItem className="mt-6 flex flex-col items-start gap-3 sm:mt-8 sm:flex-row sm:items-center sm:gap-4">
              <ButtonLink href="/about" size="lg" className="rounded-full">
                Подробнее о компании
                <ArrowRight className="size-5" />
              </ButtonLink>
              <div className="flex items-center gap-2 text-xs text-brand-black/60 sm:text-sm">
                <ShieldCheck className="size-4 text-brand-red sm:size-5" />
                Производство, монтаж и сервис в одном контуре
              </div>
            </RevealItem>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
