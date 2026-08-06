import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <Section>
      <Container className="flex min-h-hero flex-col justify-center">
        <p className="font-heading text-6xl font-bold tracking-tight text-brand-red tabular-nums sm:text-7xl">
          404
        </p>
        <h1 className="mt-5 max-w-2xl text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-brand-black/65">{t("description")}</p>
        <div className="mt-8">
          <ButtonLink href="/" size="lg" className="w-fit">
            {t("home")}
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}
