"use client";

import { FormEvent, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { siteConfig } from "@/lib/site-config";

const productTypes = ["ПВХ продукция", "Алюминиевая продукция", "Замер/консультация"];

export function LeadFormSection() {
  const [status, setStatus] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const productType = String(formData.get("productType") ?? "").trim();

    if (!name || !phone || !city || !productType) {
      setStatus("Заполните все поля, чтобы подготовить сообщение.");
      return;
    }

    const message = [
      "Здравствуйте! Хочу оставить заявку на сайте ROLLER.",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Город: ${city}`,
      `Тип продукции: ${productType}`,
    ].join("\n");

    window.open(
      `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
    setStatus("Сообщение подготовлено для отправки в WhatsApp.");
    event.currentTarget.reset();
  }

  return (
    <Section className="bg-brand-red text-brand-white">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="font-heading text-sm font-semibold tracking-[0.24em] text-brand-white/70 uppercase">
            Заявка
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-5xl">
            Рассчитаем решение под ваш объект
          </h2>
          <p className="mt-5 max-w-lg leading-7 text-brand-white/75">
            Оставьте контакты, город и тип продукции. На этом этапе форма работает как UI-заглушка и
            готовит сообщение в WhatsApp.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] bg-brand-white p-5 text-brand-black shadow-2xl shadow-brand-black/20 sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">Имя</span>
              <input
                name="name"
                required
                className="mt-2 h-12 w-full rounded-xl border border-brand-black/15 px-4 text-sm transition-colors outline-none focus:border-brand-red"
                placeholder="Ваше имя"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Телефон</span>
              <input
                name="phone"
                required
                type="tel"
                className="mt-2 h-12 w-full rounded-xl border border-brand-black/15 px-4 text-sm transition-colors outline-none focus:border-brand-red"
                placeholder="+992"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Город</span>
              <input
                name="city"
                required
                className="mt-2 h-12 w-full rounded-xl border border-brand-black/15 px-4 text-sm transition-colors outline-none focus:border-brand-red"
                placeholder="Душанбе"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">Тип продукции</span>
              <select
                name="productType"
                required
                className="mt-2 h-12 w-full rounded-xl border border-brand-black/15 px-4 text-sm transition-colors outline-none focus:border-brand-red"
                defaultValue=""
              >
                <option value="" disabled>
                  Выберите тип
                </option>
                {productTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full rounded-full">
            Отправить в WhatsApp
            <Send className="size-5" />
          </Button>
          {status ? <p className="mt-4 text-sm text-brand-black/60">{status}</p> : null}
        </form>
      </Container>
    </Section>
  );
}
