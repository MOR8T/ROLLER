"use client";

import { FormEvent, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { HomeSection, homeCard, pillClass } from "@/components/sections/home-kit";
import {
  buildQuickLeadMessage,
  buildWhatsAppUrl,
  isPlausiblePhone,
  leadScenarios,
  submitQuickLead,
} from "@/lib/leads";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";
import type { LeadScenario } from "@/types";

type Status = "idle" | "submitting" | "success" | "error";
type Field = "name" | "phone";

/**
 * The block that closes the homepage: three contacts on the left, three fields
 * on the right.
 *
 * ── Why not `RequestForm` ───────────────────────────────────────────────────
 *
 * The site's form asks for name, phone, city, product type and a comment, and
 * carries a scenario hint and a two-line note about how the request is handled.
 * That is right on a product page, where the visitor has read about one system
 * and is ready to describe an object. It is eleven lines of text at the foot of
 * a page whose whole brief was to have almost none — so the homepage asks the
 * two things the call centre cannot start without and gets the rest on the
 * phone, through `submitQuickLead`. `RequestForm` is untouched and still runs
 * every other page.
 *
 * The scenario chips survive because they are the one question that changes who
 * reads the request, and they are the same three the full form offers — labels
 * come from `requestForm.scenarios.*`, so the two never drift.
 *
 * Submit order is the site's: store first, WhatsApp second (`lib/leads.ts`).
 *
 * ── Why it is on every page ─────────────────────────────────────────────────
 *
 * It replaced `LeadFormSection` site-wide on 2026-08-16 at the client's
 * request, so this is now the one request block on the site and `RequestForm`
 * survives only inside the calculator, where the visitor has already described
 * a construction and the long form has something to carry.
 *
 * `id` is a prop because of `/contacts`: `ContactsSection` already owns
 * `id="contacts"` on that page, and two elements answering to one fragment is
 * a broken anchor and a duplicate id in the same stroke.
 */
export function ContactsLeadSection({ id = "contacts" }: { id?: string } = {}) {
  const t = useTranslations("home.contacts");
  const tScenarios = useTranslations("requestForm.scenarios");
  const tCommon = useTranslations("common");
  const uid = useId();

  const [scenario, setScenario] = useState<LeadScenario>(leadScenarios[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);

  const contacts = [
    { key: "address", value: tCommon("address"), href: siteConfig.mapUrl },
    { key: "phone", value: siteConfig.phone, href: siteConfig.phoneHref },
    { key: "email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
    { key: "whatsapp", value: tCommon("writeWhatsapp"), href: siteConfig.whatsappHref },
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();

    const nextErrors: Partial<Record<Field, string>> = {};
    if (!name) nextErrors.name = t("form.errors.name");
    if (!isPlausiblePhone(phone)) nextErrors.phone = t("form.errors.phone");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setFailure(null);
      return;
    }

    setStatus("submitting");
    setFailure(null);

    try {
      await submitQuickLead({ phone, name, scenario });
    } catch {
      setStatus("error");
      setFailure(t("form.errors.submit"));
      return;
    }

    const url = buildWhatsAppUrl(
      buildQuickLeadMessage(
        { phone, name, scenario },
        {
          intro: t("form.whatsapp.intro"),
          scenario: t("form.whatsapp.scenario"),
          name: t("form.name"),
          phone: t("form.phone"),
        },
        tScenarios(`${scenario}.label`),
      ),
    );

    setStatus("success");
    form.reset();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const submitting = status === "submitting";

  return (
    <HomeSection id={id} tone="muted">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {t("title")}
          </h2>

          <ul className="mt-10">
            {contacts.map((contact) => (
              <li key={contact.key}>
                <a
                  href={contact.href}
                  target={contact.href.startsWith("http") ? "_blank" : undefined}
                  rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="block border-t border-brand-black/12 py-5 font-heading text-lg font-semibold text-brand-black transition-colors hover:text-brand-black/55 focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none sm:text-xl"
                >
                  {contact.value}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn("bg-brand-white p-7 sm:p-10", homeCard)}>
          {status === "success" ? (
            <div role="status" aria-live="polite">
              <p className="font-heading text-2xl font-bold text-brand-black">
                {t("form.success")}
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className={pillClass("light", "mt-8")}
              >
                {t("form.again")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-label={t("title")}>
              <fieldset>
                <legend className="text-xs font-semibold tracking-[0.18em] text-brand-black/45 uppercase">
                  {t("form.scenario")}
                </legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {leadScenarios.map((option) => {
                    const selected = option === scenario;

                    return (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setScenario(option)}
                        className={cn(
                          "min-h-11 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none",
                          selected
                            ? "border-brand-black bg-brand-black text-brand-white"
                            : "border-brand-black/15 text-brand-black/65 hover:border-brand-black/45",
                        )}
                      >
                        {tScenarios(`${option}.label`)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="mt-8 flex flex-col gap-4">
                <Field
                  id={`${uid}-name`}
                  name="name"
                  label={t("form.name")}
                  placeholder={t("form.namePlaceholder")}
                  autoComplete="name"
                  error={errors.name}
                />
                <Field
                  id={`${uid}-phone`}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  label={t("form.phone")}
                  placeholder={t("form.phonePlaceholder")}
                  autoComplete="tel"
                  error={errors.phone}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={pillClass("dark", "mt-8 w-full")}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                    {t("form.submitting")}
                  </>
                ) : (
                  t("form.submit")
                )}
              </button>

              {failure ? (
                <p role="alert" className="mt-4 text-sm font-medium text-brand-red">
                  {failure}
                </p>
              ) : null}
            </form>
          )}
        </div>
      </div>
    </HomeSection>
  );
}

function Field({
  id,
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "min-h-12 w-full rounded-full border bg-brand-white px-6 text-sm transition-colors outline-none focus:border-brand-black focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2",
          error ? "border-brand-red" : "border-brand-black/20",
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 pl-6 text-sm font-medium text-brand-red">
          {error}
        </p>
      ) : null}
    </div>
  );
}
