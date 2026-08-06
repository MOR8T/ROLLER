"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
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

// Keys, not labels. The `value` the visitor picks is what ends up in the
// WhatsApp message, so it is resolved through the catalogue at render time and
// arrives at the call centre in the language the visitor was reading.
const cityKeys = ["dushanbe", "khujand"] as const;
const productTypeKeys = ["pvc", "aluminium", "consultation"] as const;

const trustPoints = [
  { key: "measure", icon: Ruler },
  { key: "response", icon: Clock },
  { key: "warranty", icon: ShieldCheck },
] as const;

export function LeadFormSection() {
  const [status, setStatus] = useState<string | null>(null);
  const t = useTranslations("leadForm");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const productType = String(formData.get("productType") ?? "").trim();
    const comment = String(formData.get("comment") ?? "").trim();

    if (!name || !phone || !city || !productType) {
      setStatus(t("errorIncomplete"));
      return;
    }

    const lines = [
      t("whatsapp.intro"),
      `${t("fields.name")}: ${name}`,
      `${t("fields.phone")}: ${phone}`,
      `${t("fields.city")}: ${city}`,
      `${t("fields.productType")}: ${productType}`,
    ];
    if (comment) {
      lines.push(`${t("fields.comment")}: ${comment}`);
    }
    const message = lines.join("\n");

    window.open(
      `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
    setStatus(t("successPrepared"));
    form.reset();
  }

  // The section used to be flooded with `bg-brand-red`. DESIGN.md §3 п.3 caps
  // red at roughly 5% of the screen and bans full-width red fills outright —
  // red reads as more urgent here precisely because it is only the button.
  return (
    <Section id="lead-form">
      <Container className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
        <Reveal>
          <p className="font-heading text-sm font-semibold tracking-[0.24em] text-brand-black/55 uppercase">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-brand-black sm:text-4xl">
            {t("title")}
          </h2>
          <ul className="mt-8 space-y-3">
            {trustPoints.map((point) => (
              <li key={point.key} className="flex items-center gap-3">
                <span className="rounded-control bg-brand-red/10 p-2 text-brand-red">
                  <point.icon className="size-5 shrink-0" />
                </span>
                <span className="text-sm font-medium text-brand-black/75">
                  {t(`trustPoints.${point.key}`)}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal>
          <form
            onSubmit={handleSubmit}
            className="rounded-card border border-brand-black/10 bg-surface-muted p-5 text-brand-black sm:p-8"
            aria-label={t("formAria")}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label={t("fields.name")} htmlFor="lead-name">
                <Input id="lead-name" name="name" required placeholder={t("placeholders.name")} />
              </Field>
              <Field label={t("fields.phone")} htmlFor="lead-phone">
                <Input
                  id="lead-phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder={t("placeholders.phone")}
                />
              </Field>
              <Field label={t("fields.city")} htmlFor="lead-city">
                <Select id="lead-city" name="city" required defaultValue="">
                  <option value="" disabled>
                    {t("selectPlaceholder")}
                  </option>
                  {cityKeys.map((key) => (
                    <option key={key}>{t(`cities.${key}`)}</option>
                  ))}
                </Select>
              </Field>
              <Field label={t("fields.productType")} htmlFor="lead-product-type">
                <Select id="lead-product-type" name="productType" required defaultValue="">
                  <option value="" disabled>
                    {t("selectPlaceholder")}
                  </option>
                  {productTypeKeys.map((key) => (
                    <option key={key}>{t(`productTypes.${key}`)}</option>
                  ))}
                </Select>
              </Field>
              <Field
                label={t("fields.comment")}
                htmlFor="lead-comment"
                optionalLabel={t("optional")}
                className="sm:col-span-2"
              >
                <Textarea
                  id="lead-comment"
                  name="comment"
                  rows={3}
                  placeholder={t("placeholders.comment")}
                />
              </Field>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full">
              {t("submit")}
              <Send className="size-5 shrink-0" />
            </Button>
            {status ? (
              <p
                className="mt-4 flex items-center gap-2 text-sm text-brand-black/60"
                aria-live="polite"
              >
                <MessageCircle className="size-4 shrink-0 text-brand-red" />
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
  optionalLabel,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  /** Rendered next to the label when the field may be left empty. */
  optionalLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("block", className)}>
      <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {label}
        {optionalLabel ? (
          <span className="text-xs font-normal text-brand-black/45">{optionalLabel}</span>
        ) : null}
      </span>
      <span className="mt-2 block">{children}</span>
    </label>
  );
}
