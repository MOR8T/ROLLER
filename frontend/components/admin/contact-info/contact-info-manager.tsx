"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { AdminContactInfoDto } from "@/components/admin-sections/contact-info-actions";
import { updateContactInfoAction } from "@/components/admin-sections/contact-info-actions";

interface ContactInfoManagerProps {
  content: AdminContactInfoDto | null;
}

/**
 * The single `contact_info` row behind `ContactsLeadSection`'s contact list
 * — rendered on `/contacts` and six other pages. One form, no add/edit/
 * delete, same locale-tab pattern as `AboutContentManager` for the one
 * field (`address`) that is actually per-locale; phone/email/WhatsApp/map
 * link are locale-independent and sit above the tabs.
 *
 * `content === null` means the backend was unreachable when this page's
 * server component fetched it — the form still renders (empty), and saving
 * will simply fail with the usual "Не удалось связаться с сервером".
 */
export function ContactInfoManager({ content }: ContactInfoManagerProps) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<Locale>("ru");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateContactInfoAction(formData);
      if (!result.success) {
        showToast(result.error);
        return;
      }
      showToast("Сохранено", "success");
      router.refresh();
    });
  }

  return (
    <section className="border-t border-brand-black/10 pt-8">
      <div>
        <h2 className="text-lg font-semibold text-brand-black">Контактные данные</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Телефон, email, WhatsApp, ссылка на карту и адрес — то, что показывает блок «Свяжитесь с
          нами» на всех страницах сайта.
        </p>
      </div>

      <form onSubmit={submit} className="mt-5 space-y-6">
        <fieldset className="rounded-card border border-brand-black/10 p-5">
          <legend className="px-1 text-sm font-semibold text-brand-black">Контакты</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              name="phone"
              label="Телефон"
              defaultValue={content?.phone}
              disabled={isPending}
            />
            <Field name="email" label="Email" defaultValue={content?.email} disabled={isPending} />
            <Field
              name="whatsapp"
              label="WhatsApp (только цифры, с кодом страны)"
              defaultValue={content?.whatsapp}
              disabled={isPending}
            />
            <Field
              name="map_url"
              label="Ссылка на карту"
              defaultValue={content?.mapUrl}
              disabled={isPending}
            />
          </div>
        </fieldset>

        <div>
          <div className="flex flex-wrap gap-1.5 border-b border-brand-black/10">
            {locales.map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={cn(
                  "-mb-px rounded-t-control border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                  activeLocale === locale
                    ? "border-brand-red text-brand-black"
                    : "border-transparent text-neutral-500 hover:text-brand-black",
                )}
              >
                {locale.toUpperCase()} · {localeLabels[locale]}
              </button>
            ))}
          </div>

          {locales.map((locale) => (
            <div key={locale} hidden={activeLocale !== locale} className="space-y-4 pt-5">
              <fieldset className="rounded-card border border-brand-black/10 p-5">
                <legend className="px-1 text-sm font-semibold text-brand-black">Адрес</legend>
                <Field
                  name={`address_${locale}`}
                  label="Адрес"
                  defaultValue={content?.address[locale]}
                  disabled={isPending}
                />
              </fieldset>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </form>
    </section>
  );
}

function Field({
  name,
  label,
  defaultValue,
  disabled,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-brand-black">
        {label}
      </label>
      <Input id={name} name={name} required defaultValue={defaultValue} disabled={disabled} />
    </div>
  );
}
