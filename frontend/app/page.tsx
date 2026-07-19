import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/lib/site-config";

export default function Home() {
  return (
    <Section>
      <Container className="flex flex-col items-center text-center">
        <span className="rounded-full bg-brand-red/10 px-4 py-1 text-sm font-medium text-brand-red">
          {siteConfig.foundedYear} · {new Date().getFullYear() - siteConfig.foundedYear} лет на
          рынке
        </span>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {siteConfig.slogan.ru}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-brand-black/60">
          Профильные системы ПВХ и алюминий в Таджикистане. Фундамент проекта готов — главная
          страница будет собрана на этапе 02.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/calculator" size="lg">
            Рассчитать стоимость
          </ButtonLink>
          <ButtonLink href={siteConfig.whatsappHref} variant="outline" size="lg">
            Написать в WhatsApp
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
