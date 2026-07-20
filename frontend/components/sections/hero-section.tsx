import { ArrowDown, ArrowRight, CheckCircle2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";
import { serviceHighlights } from "@/data/home";

export function HeroSection() {
  return (
    <section className="relative isolate -mt-16 overflow-hidden bg-brand-black text-brand-white lg:-mt-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_20%,rgba(211,0,26,0.42),transparent_34%),linear-gradient(120deg,rgba(29,29,27,0.95),rgba(29,29,27,0.72)),linear-gradient(135deg,rgba(255,255,255,0.16)_0_1px,transparent_1px_32px)]" />
      <Container className="grid min-h-[680px] items-center gap-10 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-white/20 bg-brand-white/10 px-4 py-2 text-sm text-brand-white/80 backdrop-blur">
            <CheckCircle2 className="size-4 text-brand-red" />
            Собственное производство профилей ПВХ и алюминия
          </div>
          <h1 className="mt-7 text-5xl leading-[0.95] font-bold tracking-tight sm:text-6xl lg:text-7xl">
            {siteConfig.slogan.ru}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-brand-white/72 sm:text-xl">
            <span><span className="text-brand-red">ROL</span><span className="text-brand-black">LER</span></span> создаёт профильные системы, окна, двери и фасадные решения для домов, бизнеса
            и современных городских объектов в Таджикистане.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/calculator" size="lg" className="rounded-full">
              Рассчитать стоимость
              <ArrowRight className="size-5" />
            </ButtonLink>
            <ButtonLink
              href={siteConfig.whatsappHref}
              variant="outline"
              size="lg"
              className="rounded-full border-brand-white/35 text-brand-white hover:bg-brand-white/10"
            >
              Заказать звонок
            </ButtonLink>
          </div>
        </div>

        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] border border-brand-white/15 bg-brand-white/10 p-5 shadow-2xl shadow-brand-black/40 backdrop-blur">
            <div className="flex h-full flex-col justify-between rounded-[1.5rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.24),rgba(255,255,255,0.05)),radial-gradient(circle_at_65%_30%,rgba(255,255,255,0.42),transparent_30%)] p-6">
              <div className="ml-auto w-fit rounded-full bg-brand-red px-4 py-2 font-heading text-sm font-semibold">
                ROLLER
              </div>
              <div className="space-y-3">
                <div className="h-32 rounded-3xl border border-brand-white/25 bg-brand-white/20" />
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-28 rounded-2xl bg-brand-white/15" />
                  <div className="h-28 rounded-2xl bg-brand-red/70" />
                  <div className="h-28 rounded-2xl bg-brand-white/15" />
                </div>
              </div>
              <div>
                <p className="font-heading text-3xl font-bold">20 лет</p>
                <p className="mt-2 text-sm text-brand-white/70">
                  Опыт производства, монтажа и сервиса профильных систем.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-8 left-4 grid w-[calc(100%-2rem)] grid-cols-2 gap-3 rounded-3xl border border-brand-white/15 bg-brand-black/80 p-4 backdrop-blur sm:grid-cols-4">
            {serviceHighlights.map((item) => (
              <div key={item.label} className="rounded-2xl bg-brand-white/8 p-3">
                <item.icon className="size-5 text-brand-red" />
                <p className="mt-2 text-xs font-semibold text-brand-white/80">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
      <Container className="hidden pb-8 lg:block">
        <a
          href="#about"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand-white/60 transition-colors hover:text-brand-white"
        >
          Листайте ниже
          <ArrowDown className="size-4" />
        </a>
      </Container>
    </section>
  );
}
