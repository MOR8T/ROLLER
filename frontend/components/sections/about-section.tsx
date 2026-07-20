import { Factory, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { siteConfig } from "@/lib/site-config";

export function AboutSection() {
  const years = new Date().getFullYear() - siteConfig.foundedYear;

  return (
    <Section id="about" className="bg-neutral-50">
      <Container className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative">
          <div className="aspect-[4/3] rounded-[2rem] bg-[linear-gradient(135deg,rgba(211,0,26,0.12),rgba(29,29,27,0.08)),linear-gradient(135deg,transparent_0_18px,rgba(29,29,27,0.08)_18px_19px,transparent_19px_42px)] p-6">
            <div className="h-full rounded-[1.5rem] border border-brand-black/10 bg-brand-white p-6 shadow-sm">
              <div className="flex h-full flex-col justify-between">
                <Factory className="size-14 text-brand-red" />
                <div>
                  <p className="font-heading text-6xl font-bold text-brand-black">{years}</p>
                  <p className="mt-2 max-w-xs text-sm font-medium text-brand-black/60">
                    лет производственного опыта и развития профильных систем.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -right-3 -bottom-6 max-w-xs rounded-3xl bg-brand-black p-5 text-brand-white shadow-xl sm:right-8">
            <ShieldCheck className="size-7 text-brand-red" />
            <p className="mt-3 text-sm leading-6 text-brand-white/75">
              Производство, монтаж и сервис объединены в один понятный процесс для клиента.
            </p>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="О компании"
            title={
              <>
                <span className="text-brand-red">ROL</span>
                <span className="text-brand-black">LER</span>
                {" — профильные решения для домов и бизнеса"}
              </>
            }
            description="Мы развиваем собственное производство ПВХ и алюминиевых систем в Таджикистане, чтобы клиент получал не просто изделие, а готовое решение: консультация, замер, производство, доставка, монтаж и обслуживание."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-5">
              <p className="font-heading text-2xl font-bold text-brand-red">2006</p>
              <p className="mt-2 text-sm leading-6 text-brand-black/65">год основания компании</p>
            </div>
            <div className="rounded-2xl border border-brand-black/10 bg-brand-white p-5">
              <p className="font-heading text-2xl font-bold text-brand-red">Full cycle</p>
              <p className="mt-2 text-sm leading-6 text-brand-black/65">
                от выбора системы до готового объекта
              </p>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
