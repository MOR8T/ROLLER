"use client";

import { FormEvent, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildLeadMessage, buildWhatsAppUrl, isPlausiblePhone, submitLead } from "@/lib/leads";
import { cn } from "@/lib/utils";
import type { Lead, LeadScenario } from "@/types";

/**
 * The site's one request form (`project_plan/06-*.md`).
 *
 * Three scenarios — «Рассчитать» / «Получить КП» / «Стать дилером» — because
 * the same five fields serve a flat owner, a developer and a dealer, and the
 * only thing that differs is who reads the request. The scenario travels with
 * the lead and is spelled out in the WhatsApp text; a human sorts it, and the
 * plan explicitly does not ask for a workflow in the admin panel.
 *
 * **Submit order is the point of this component.** The lead is stored first,
 * and only a stored lead opens WhatsApp. If the store fails, the visitor sees
 * the failure and WhatsApp never opens — the reverse order loses the request
 * silently the moment someone closes WhatsApp without pressing send.
 */

// Keys, not labels. The value the visitor picks is resolved through the
// catalogue at render time, so the call centre reads the request in the
// language the visitor was reading.
const cityKeys = ["dushanbe", "khujand", "bokhtar", "kulob", "other"] as const;
const productTypeKeys = ["pvc", "aluminium", "consultation"] as const;

type Field = "name" | "phone" | "city" | "productType";
type Status = "idle" | "submitting" | "success" | "error";

interface RequestFormProps {
  /** Scenarios on offer. A single one hides the picker. */
  scenarios: readonly LeadScenario[];
  /** Preselected scenario. Defaults to the first on offer. */
  defaultScenario?: LeadScenario;
  /**
   * Read at submit time, not at render time: on the calculator page the
   * summary changes with every slider move, and the form has no business
   * re-rendering for that.
   */
  buildConfiguration?: () => string | null;
  /** `inverse` is the dark-ground pair required by DESIGN.md §9. */
  tone?: "surface" | "inverse";
  className?: string;
}

export function RequestForm({
  scenarios,
  defaultScenario,
  buildConfiguration,
  tone = "surface",
  className,
}: RequestFormProps) {
  const t = useTranslations("requestForm");
  const uid = useId();

  const [scenario, setScenario] = useState<LeadScenario>(defaultScenario ?? scenarios[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const inverse = tone === "inverse";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const read = (key: string) => String(data.get(key) ?? "").trim();

    const lead: Lead = {
      scenario,
      name: read("name"),
      phone: read("phone"),
      city: read("city"),
      productType: read("productType"),
      comment: read("comment") || undefined,
      configuration: buildConfiguration?.() ?? undefined,
    };

    const nextErrors: Partial<Record<Field, string>> = {};
    if (!lead.name) nextErrors.name = t("errors.name");
    if (!lead.phone) nextErrors.phone = t("errors.phoneRequired");
    else if (!isPlausiblePhone(lead.phone)) nextErrors.phone = t("errors.phoneInvalid");
    if (!lead.city) nextErrors.city = t("errors.city");
    if (!lead.productType) nextErrors.productType = t("errors.productType");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setFailure(null);
      return;
    }

    setStatus("submitting");
    setFailure(null);

    try {
      // 1. Store. 2. Only then WhatsApp. Never the other way round.
      await submitLead(lead);
    } catch {
      setStatus("error");
      setFailure(t("errors.submit"));
      return;
    }

    const message = buildLeadMessage(
      lead,
      {
        intro: t("whatsapp.intro"),
        scenario: t("whatsapp.scenario"),
        name: t("fields.name"),
        phone: t("fields.phone"),
        city: t("fields.city"),
        productType: t("fields.productType"),
        comment: t("fields.comment"),
        configuration: t("fields.configuration"),
      },
      t(`scenarios.${scenario}.label`),
    );
    const url = buildWhatsAppUrl(message);

    setWhatsappUrl(url);
    setStatus("success");
    form.reset();

    // The tab may be blocked — the lead is already stored, so a blocked popup
    // is not a lost request, and the success panel carries the link either way.
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (status === "success") {
    return (
      <div
        className={cn(
          "rounded-card border p-6 sm:p-8",
          inverse
            ? "border-brand-white/15 bg-brand-white/5"
            : "border-brand-black/10 bg-surface-muted",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="size-8 text-brand-red" aria-hidden />
        <h3
          className={cn(
            "mt-4 text-xl font-bold",
            inverse ? "text-brand-white" : "text-brand-black",
          )}
        >
          {t("success.title")}
        </h3>
        <p
          className={cn(
            "mt-3 text-sm leading-6",
            inverse ? "text-brand-white/70" : "text-brand-black/65",
          )}
        >
          {t("success.description")}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-brand-red px-6 py-2.5 text-sm font-medium text-brand-white transition-colors hover:bg-brand-red/90 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t("success.openWhatsapp")}
            </a>
          ) : null}
          <Button
            type="button"
            variant={inverse ? "outline-inverse" : "outline"}
            onClick={() => {
              setStatus("idle");
              setWhatsappUrl(null);
            }}
          >
            {t("success.again")}
          </Button>
        </div>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={t("formAria")}
      className={cn(
        "rounded-card border p-5 sm:p-8",
        inverse
          ? "border-brand-white/15 bg-brand-white/5 text-brand-white"
          : "border-brand-black/10 bg-surface-muted text-brand-black",
        className,
      )}
    >
      {scenarios.length > 1 ? (
        <fieldset>
          <legend className={cn("text-sm font-semibold", inverse && "text-brand-white")}>
            {t("scenarioLabel")}
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {scenarios.map((option) => {
              const active = option === scenario;

              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setScenario(option)}
                  className={cn(
                    "rounded-control border px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none",
                    active && "border-brand-red bg-brand-red text-brand-white",
                    !active &&
                      (inverse
                        ? "border-brand-white/25 bg-transparent text-brand-white/80 hover:border-brand-white/60"
                        : "border-brand-black/15 bg-surface text-brand-black/75 hover:border-brand-red/50 hover:text-brand-red"),
                  )}
                >
                  {t(`scenarios.${option}.label`)}
                </button>
              );
            })}
          </div>
          <p
            className={cn("mt-3 text-sm", inverse ? "text-brand-white/60" : "text-brand-black/60")}
          >
            {t(`scenarios.${scenario}.hint`)}
          </p>
        </fieldset>
      ) : null}

      <div className={cn("grid gap-5 sm:grid-cols-2", scenarios.length > 1 && "mt-7")}>
        <Field
          label={t("fields.name")}
          htmlFor={`${uid}-name`}
          error={errors.name}
          inverse={inverse}
        >
          <Input
            id={`${uid}-name`}
            name="name"
            autoComplete="name"
            placeholder={t("placeholders.name")}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <Field
          label={t("fields.phone")}
          htmlFor={`${uid}-phone`}
          error={errors.phone}
          inverse={inverse}
        >
          <Input
            id={`${uid}-phone`}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("placeholders.phone")}
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>

        <Field
          label={t("fields.city")}
          htmlFor={`${uid}-city`}
          error={errors.city}
          inverse={inverse}
        >
          <Select
            id={`${uid}-city`}
            name="city"
            defaultValue=""
            aria-invalid={Boolean(errors.city)}
          >
            <option value="" disabled>
              {t("selectPlaceholder")}
            </option>
            {cityKeys.map((key) => (
              <option key={key}>{t(`cities.${key}`)}</option>
            ))}
          </Select>
        </Field>

        <Field
          label={t("fields.productType")}
          htmlFor={`${uid}-product-type`}
          error={errors.productType}
          inverse={inverse}
        >
          <Select
            id={`${uid}-product-type`}
            name="productType"
            defaultValue=""
            aria-invalid={Boolean(errors.productType)}
          >
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
          htmlFor={`${uid}-comment`}
          optionalLabel={t("optional")}
          className="sm:col-span-2"
          inverse={inverse}
        >
          <Textarea
            id={`${uid}-comment`}
            name="comment"
            rows={3}
            placeholder={t("placeholders.comment")}
          />
        </Field>
      </div>

      <Button type="submit" size="lg" className="mt-6 w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
            {t("submitting")}
          </>
        ) : (
          <>
            {t("submit")}
            <Send className="size-5 shrink-0" aria-hidden />
          </>
        )}
      </Button>

      <p
        className={cn(
          "mt-4 text-xs leading-5",
          inverse ? "text-brand-white/55" : "text-brand-black/55",
        )}
      >
        {t("note")}
      </p>

      {failure ? (
        <p role="alert" className="mt-4 flex items-start gap-2 text-sm font-medium text-brand-red">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {failure}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optionalLabel,
  error,
  inverse,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  optionalLabel?: string;
  error?: string;
  inverse: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("block", className)}>
      <label htmlFor={htmlFor} className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {label}
        {optionalLabel ? (
          <span
            className={cn(
              "text-xs font-normal",
              inverse ? "text-brand-white/50" : "text-brand-black/45",
            )}
          >
            {optionalLabel}
          </span>
        ) : null}
      </label>
      <div className="mt-2">{children}</div>
      {error ? <p className="mt-2 text-sm font-medium text-brand-red">{error}</p> : null}
    </div>
  );
}
