"use client";

import { FormEvent, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

import { HomeSection, homeCard, pillClass } from "@/components/sections/home-kit";
import { categories } from "@/data/products";
import {
  buildQuickLeadMessage,
  buildWhatsAppUrl,
  isPlausiblePhone,
  submitQuickLead,
} from "@/lib/leads";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

type Status = "idle" | "submitting" | "success" | "error";
type Field = "name" | "phone";

export interface ContactsLeadSectionProps {
  id?: string;
  /** Overrides `home.contacts.title`. */
  title?: string;
  /** A line under the heading. The homepage has none. */
  description?: string;
  /** Where the request came from, written for a human: «Система ROLLER». */
  context?: string;
}
export function ContactsLeadSection({
  id = "contacts",
  title,
  description,
  context,
}: ContactsLeadSectionProps = {}) {
  const t = useTranslations("home.contacts");
  const tCategories = useTranslations("categories");
  const tCommon = useTranslations("common");
  const uid = useId();

  const [interests, setInterests] = useState<string[]>([]);
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

    setStatus("submitting");
    setFailure(null);

    try {
      await submitQuickLead({ phone, name, interests, context, message });
    } catch {
      setStatus("error");
      setFailure(t("form.errors.submit"));
      return;
    }

    const url = buildWhatsAppUrl(
      buildQuickLeadMessage(
        { phone, name, interests, context, message },
        {
          intro: t("form.whatsapp.intro"),
          interests: t("form.whatsapp.interests"),
          context: t("form.whatsapp.context"),
          name: t("form.name"),
          phone: t("form.phone"),
          message: t("form.whatsapp.message"),
        },
        interests.map((slug) => tCategories(`items.${slug}.title`)),
      ),
    );

    setStatus("success");
    form.reset();
    setInterests([]);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const submitting = status === "submitting";

  function toggleInterest(slug: string, checked: boolean) {
    setInterests((current) =>
      checked ? [...current, slug] : current.filter((item) => item !== slug),
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
      {/* «Что вас интересует?» — the catalog's own categories, not a second
          list to keep in step with it. Several may be ticked: a visitor
          replacing the windows of a house is usually asking about the doors in
          the same breath. */}
      <fieldset>
        <legend className="text-xs font-semibold tracking-[0.18em] text-brand-black/45 uppercase">
          {t("form.interests")}
        </legend>

        <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {categories.map((category) => {
            const checkboxId = `${uid}-interest-${category.slug}`;
            const checked = interests.includes(category.slug);
            const label = tCategories(`items.${category.slug}.title`);

            return (
              <Checkbox
                key={category.slug}
                id={checkboxId}
                checked={checked}
                label={label}
                onChange={(next) => toggleInterest(category.slug, next)}
              />
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
    <HomeSection id={id} tone="muted">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-brand-black sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
            {title ?? t("title")}
          </h2>

          {description ? (
            <p className="mt-5 max-w-xl text-base leading-7 text-brand-black/65">{description}</p>
          ) : null}

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
          {status === "success" ? success : form}
        </div>
      </div>
    </HomeSection>
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
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 cursor-pointer accent-brand-black focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2 focus-visible:outline-none"
      />
      <label htmlFor={id} className="cursor-pointer text-sm leading-6 text-brand-black/75">
        {label}
      </label>
    </div>
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
