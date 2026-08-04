"use client";

import { FormEvent, useState } from "react";
import { Clock, MessageCircle, Ruler, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const cityOptions = ["Душанбе", "Худжант"];
const productTypes = ["ПВХ продукция", "Алюминиевая продукция", "Замер/консультация"];

const trustPoints = [
  { icon: Ruler, label: "Бесплатный замер и расчёт" },
  { icon: Clock, label: "Ответ в течение дня" },
  { icon: ShieldCheck, label: "Гарантия производителя" },
];

export function LeadFormSection() {
  const [status, setStatus] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const productType = String(formData.get("productType") ?? "").trim();
    const comment = String(formData.get("comment") ?? "").trim();

    if (!name || !phone || !city || !productType) {
      setStatus("Заполните все поля, чтобы подготовить сообщение.");
      return;
    }

    const lines = [
      "Здравствуйте! Хочу оставить заявку на сайте ROLLER.",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Город: ${city}`,
      `Тип продукции: ${productType}`,
    ];
    if (comment) {
      lines.push(`Комментарий: ${comment}`);
    }
    const message = lines.join("\n");

    window.open(
      `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
    setStatus("Сообщение подготовлено для отправки в WhatsApp.");
    event.currentTarget.reset();
  }

  // The section used to be flooded with `bg-brand-red`. DESIGN.md §3 п.3 caps
  // red at roughly 5% of the screen and bans full-width red fills outright —
  // red reads as more urgent here precisely because it is only the button.
  return (
    <Section id="lead-form">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        <Reveal>
          <p className="font-heading text-sm font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
            Заявка
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
            Рассчитаем решение под ваш объект
          </h2>
          <ul className="mt-8 space-y-3">
            {trustPoints.map((point) => (
              <li key={point.label} className="flex items-center gap-3">
                <span className="rounded-control bg-brand-red/10 p-2 text-brand-red">
                  <point.icon className="size-5" />
                </span>
                <span className="text-sm font-medium text-brand-black/75">{point.label}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <form
            onSubmit={handleSubmit}
            className="rounded-card border border-brand-black/10 bg-surface-muted p-5 text-brand-black sm:p-8"
            aria-label="Форма заявки"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Имя" htmlFor="lead-name">
                <Input id="lead-name" name="name" required placeholder="Ваше имя" />
              </Field>
              <Field label="Телефон" htmlFor="lead-phone">
                <Input id="lead-phone" name="phone" type="tel" required placeholder="+992" />
              </Field>
              <Field label="Город" htmlFor="lead-city">
                <Select id="lead-city" name="city" required defaultValue="Душанбе">
                  <option value="" disabled>
                    Выберите тип
                  </option>
                  {cityOptions.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Тип продукции" htmlFor="lead-product-type">
                <Select id="lead-product-type" name="productType" required defaultValue="">
                  <option value="" disabled>
                    Выберите тип
                  </option>
                  {productTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Комментарий" htmlFor="lead-comment" optional className="sm:col-span-2">
                <Textarea
                  id="lead-comment"
                  name="comment"
                  rows={3}
                  placeholder="Опишите объект, сроки или вопрос — необязательно"
                />
              </Field>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full">
              Отправить в WhatsApp
              <Send className="size-5" />
            </Button>
            {status ? (
              <p
                className="mt-4 flex items-center gap-2 text-sm text-brand-black/60"
                aria-live="polite"
              >
                <MessageCircle className="size-4 text-brand-red" />
                {status}
              </p>
            ) : null}
          </form>
        </Reveal>
      </Container>
    </Section>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("block", className)}>
      <span className="flex items-center gap-2 text-sm font-semibold">
        {label}
        {optional ? (
          <span className="text-xs font-normal text-brand-black/45">(необязательно)</span>
        ) : null}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
