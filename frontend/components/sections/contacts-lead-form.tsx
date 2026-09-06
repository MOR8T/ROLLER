"use client";

import { FormEvent, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { homeCard, pillClass } from "@/components/sections/home-kit";
import type { ContactInterestDto } from "@/lib/contact-interests";
import {
  buildQuickLeadMessage,
  buildWhatsAppUrl,
  isPlausiblePhone,
  submitQuickLead,
} from "@/lib/leads";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";
type Field = "name" | "phone";

export interface ContactsLeadFormProps {
  /** Where the request came from, written for a human: «Система ROLLER». */
  context?: string;
  /** The "Что вас интересует?" checkbox options, admin-managed and already
   * locale-resolved by `ContactsLeadSection`. */
  interests: ContactInterestDto[];
}

/**
 * The interactive half of `ContactsLeadSection` — split out so the section's
 * contact list can be a Server Component (it fetches `getContactInfo`, which
 * needs `await`) while this half keeps its own client-side form state.
 */
export function ContactsLeadForm({ context, interests }: ContactsLeadFormProps) {
  const t = useTranslations("home.contacts");
  const uid = useId();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const phone = String(data.get("phone") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const nextErrors: Partial<Record<Field, string>> = {};
    if (!name) nextErrors.name = t("form.errors.name");
    if (!isPlausiblePhone(phone)) nextErrors.phone = t("form.errors.phone");

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      setFailure(null);
      return;
    }

    const selectedLabels = interests
      .filter((interest) => selectedIds.includes(interest.id))
      .map((interest) => interest.label);

    setStatus("submitting");
    setFailure(null);

    try {
      await submitQuickLead({ phone, name, interests: selectedLabels, context, message });
    } catch {
      setStatus("error");
      setFailure(t("form.errors.submit"));
      return;
    }

    const url = buildWhatsAppUrl(
      buildQuickLeadMessage(
        { phone, name, interests: selectedLabels, context, message },
        {
          intro: t("form.whatsapp.intro"),
          interests: t("form.whatsapp.interests"),
          context: t("form.whatsapp.context"),
          name: t("form.name"),
          phone: t("form.phone"),
          message: t("form.whatsapp.message"),
        },
        selectedLabels,
      ),
    );

    setStatus("success");
    form.reset();
    setSelectedIds([]);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const submitting = status === "submitting";

  function toggleInterest(id: number, checked: boolean) {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
  }

  const success = (
    <div role="status" aria-live="polite">
      <p className="font-heading text-2xl font-bold text-brand-black">{t("form.success")}</p>
      <button
        type="button"
        onClick={() => setStatus("idle")}
        className={pillClass("light", "mt-8")}
      >
        {t("form.again")}
      </button>
    </div>
  );

  const form = (
    <form onSubmit={handleSubmit} noValidate aria-label={t("title")}>
      {/* «Что вас интересует?» — admin-managed (`/admin/contacts`), not tied
          to the product catalogue. Several may be ticked: a visitor
          replacing the windows of a house is usually asking about the doors in
          the same breath. */}
      {interests.length > 0 ? (
        <fieldset>
          <legend className="text-xs font-semibold tracking-[0.18em] text-brand-black/45 uppercase">
            {t("form.interests")}
          </legend>

          {/* `gap-y-1`, because each row now carries `py-1` of its own — see
              `Checkbox`. The two together reproduce the old 36px pitch. */}
          <div className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {interests.map((interest) => {
              const checkboxId = `${uid}-interest-${interest.id}`;
              const checked = selectedIds.includes(interest.id);

              return (
                <Checkbox
                  key={interest.id}
                  id={checkboxId}
                  checked={checked}
                  label={interest.label}
                  onChange={(next) => toggleInterest(interest.id, next)}
                />
              );
            })}
          </div>
        </fieldset>
      ) : null}

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

        {/* Optional, and unvalidated: the two fields above are what the call
            centre cannot start without, and a comment box that can reject a
            request would undo that. */}
        <TextField
          id={`${uid}-message`}
          name="message"
          label={t("form.message")}
          placeholder={t("form.messagePlaceholder")}
        />
      </div>

      <button type="submit" disabled={submitting} className={pillClass("dark", "mt-8 w-full")}>
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
  );

  return (
    <div className={cn("bg-brand-white p-7 sm:p-10", homeCard)}>
      {status === "success" ? success : form}
    </div>
  );
}

/** One ticked category. */
function Checkbox({
  id,
  checked,
  label,
  onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    // The `<label>` *is* the row, not just the words: a 16px box beside a
    // detached caption left a 12px dead gutter between them and a 24px-tall
    // target on a phone. Wrapping the row makes the whole width of the column
    // tappable. `py-1` against the grid's `gap-y-1` keeps the 36px pitch the
    // list had when it was 24px rows on a 12px gap.
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 py-1">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 cursor-pointer accent-brand-black focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none"
      />
      <span className="text-sm leading-6 text-brand-black/75">{label}</span>
    </label>
  );
}

/**
 * The comment box.
 *
 * Not a `Field` with `as="textarea"`: the shapes genuinely differ — a pill
 * cannot hold four lines, so this one takes the card's radius instead — and one
 * branch inside `Field` would be there to save four lines of markup.
 */
function TextField({
  id,
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; label: string }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        className="w-full rounded-[1.75rem] border border-brand-black/20 bg-brand-white px-6 py-4 text-sm transition-colors outline-none focus:border-brand-black focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2"
        {...props}
      />
    </div>
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
