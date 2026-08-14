"use client";

import { FormEvent, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { pillClass } from "@/components/sections/home-kit";
import { Container } from "@/components/ui/container";
import {
  buildQuickLeadMessage,
  buildWhatsAppUrl,
  isPlausiblePhone,
  submitQuickLead,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * "Вызвать замерщика бесплатно" — one line, one field, one button.
 *
 * A rule between two sections rather than a section of its own: no heading
 * hierarchy of its own to speak of, no supporting copy, and the borders instead
 * of the vertical rhythm. Everything that was written around it — what the
 * measurement costs, when we call back, the phone number underneath — is either
 * already in the header or belongs on `/contacts`.
 *
 * Submit order is the site's and is not negotiable: store first, WhatsApp
 * second (`lib/leads.ts`).
 */
export function MeasureStripSection() {
  const t = useTranslations("home.measure");
  const uid = useId();

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const phone = String(new FormData(form).get("phone") ?? "").trim();

    if (!isPlausiblePhone(phone)) {
      setStatus("error");
      setError(t("errors.phone"));
      return;
    }

    setStatus("submitting");
    setError(null);

    try {
      await submitQuickLead({ phone });
    } catch {
      setStatus("error");
      setError(t("errors.submit"));
      return;
    }

    const url = buildWhatsAppUrl(
      buildQuickLeadMessage({ phone }, { intro: t("whatsapp.intro"), phone: t("phoneLabel") }),
    );

    setStatus("success");
    form.reset();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const submitting = status === "submitting";

  return (
    <section id="measure" className="border-y border-brand-black/10 py-10 sm:py-12">
      <Container className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <h2 className="font-heading text-2xl font-bold tracking-tight text-brand-black uppercase sm:text-3xl">
          {t("title")}
        </h2>

        {status === "success" ? (
          <p
            role="status"
            aria-live="polite"
            className="text-base font-medium text-brand-black lg:w-[28rem] lg:shrink-0"
          >
            {t("success")}
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-label={t("title")}
            className="lg:w-[28rem] lg:shrink-0"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <label htmlFor={`${uid}-phone`} className="sr-only">
                {t("phoneLabel")}
              </label>
              {/* Not the shared `Input`: the homepage's field is a pill with a
                  hairline, to match the buttons beside it. */}
              <input
                id={`${uid}-phone`}
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={t("phonePlaceholder")}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${uid}-error` : undefined}
                className={cn(
                  "min-h-12 w-full rounded-full border bg-brand-white px-6 text-sm transition-colors outline-none focus:border-brand-black focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 sm:flex-1",
                  error ? "border-brand-red" : "border-brand-black/20",
                )}
              />
              <button type="submit" disabled={submitting} className={pillClass("dark")}>
                {submitting ? (
                  <>
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    {t("submitting")}
                  </>
                ) : (
                  t("submit")
                )}
              </button>
            </div>

            {error ? (
              <p
                id={`${uid}-error`}
                role="alert"
                className="mt-3 text-sm font-medium text-brand-red"
              >
                {error}
              </p>
            ) : null}
          </form>
        )}
      </Container>
    </section>
  );
}
