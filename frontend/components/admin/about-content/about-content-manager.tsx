"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AdminAboutContentDto } from "@/app/admin/(dashboard)/about-content-actions";
import { updateAboutContentAction } from "@/app/admin/(dashboard)/about-content-actions";

interface AboutContentManagerProps {
  content: AdminAboutContentDto | null;
}

/**
 * `/about`'s hero title/description, history narrative, the two list
 * sections' own headings, and the "Дорогие клиенты" quote — everything on
 * the page that isn't a reorderable list (`AboutTimelineManager`,
 * `AboutCertificatesManager`) or shared brand marks (`PartnersManager`).
 *
 * One form, no add/edit/delete: it edits the single `about_content` row in
 * place, same locale-tab pattern as `NewsManager`'s `ArticleFields` — all 4
 * locales' fields stay mounted (`hidden`, not unmounted) so switching tabs
 * never drops what was typed on another one.
 *
 * `content === null` means the backend was unreachable when this page's
 * server component fetched it — the form still renders (empty), and saving
 * will simply fail with the usual "Не удалось связаться с сервером".
 */
export function AboutContentManager({ content }: AboutContentManagerProps) {
  const router = useRouter();
  const [activeLocale, setActiveLocale] = useState<Locale>("ru");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateAboutContentAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <section className="border-t border-brand-black/10 pt-8">
      <div>
        <h2 className="text-lg font-semibold text-brand-black">Тексты страницы</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Заголовок, история компании, заголовки разделов «Таймлайн» и «Сертификаты», обращение к
          клиентам, и статистика на этой странице и на главной.
        </p>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-brand-red">
          {error}
        </p>
      ) : null}
      {saved && !error ? <p className="mt-4 text-sm text-emerald-600">Сохранено</p> : null}

      <form onSubmit={submit} className="mt-5 space-y-6">
        <fieldset className="rounded-card border border-brand-black/10 p-5">
          <legend className="px-1 text-sm font-semibold text-brand-black">Статистика</legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatFields
              statKey="years"
              label="Лет на рынке"
              stat={content?.stats.years}
              disabled={isPending}
            />
            <StatFields
              statKey="projects"
              label="Объектов"
              stat={content?.stats.projects}
              disabled={isPending}
            />
            <StatFields
              statKey="employees"
              label="Сотрудников"
              stat={content?.stats.employees}
              disabled={isPending}
            />
            <StatFields
              statKey="tonnage"
              label="Тонн в год"
              stat={content?.stats.tonnage}
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
            <div key={locale} hidden={activeLocale !== locale} className="space-y-6 pt-5">
              <Fieldset legend="Заголовок страницы">
                <LocalizedInput
                  field="heroTitle"
                  locale={locale}
                  label="Заголовок"
                  defaultValue={content?.heroTitle[locale]}
                  disabled={isPending}
                />
                <LocalizedTextarea
                  field="heroDescription"
                  locale={locale}
                  label="Описание"
                  rows={2}
                  defaultValue={content?.heroDescription[locale]}
                  disabled={isPending}
                />
              </Fieldset>

              <Fieldset legend="История компании">
                <LocalizedInput
                  field="storyTitle"
                  locale={locale}
                  label="Заголовок"
                  defaultValue={content?.storyTitle[locale]}
                  disabled={isPending}
                />
                <LocalizedTextarea
                  field="storyParagraphs"
                  locale={locale}
                  label="Текст"
                  hint="Каждый абзац — с новой строки, через пустую строку между ними."
                  rows={8}
                  defaultValue={content?.storyParagraphs[locale]}
                  disabled={isPending}
                />
              </Fieldset>

              <Fieldset legend="Заголовок раздела «Как компания росла»">
                <LocalizedInput
                  field="timelineTitle"
                  locale={locale}
                  label="Заголовок"
                  defaultValue={content?.timelineTitle[locale]}
                  disabled={isPending}
                />
                <LocalizedTextarea
                  field="timelineDescription"
                  locale={locale}
                  label="Описание"
                  rows={2}
                  defaultValue={content?.timelineDescription[locale]}
                  disabled={isPending}
                />
              </Fieldset>

              <Fieldset legend="Заголовок раздела «Сертификаты»">
                <LocalizedInput
                  field="certificatesTitle"
                  locale={locale}
                  label="Заголовок"
                  defaultValue={content?.certificatesTitle[locale]}
                  disabled={isPending}
                />
                <LocalizedTextarea
                  field="certificatesDescription"
                  locale={locale}
                  label="Описание"
                  rows={2}
                  defaultValue={content?.certificatesDescription[locale]}
                  disabled={isPending}
                />
              </Fieldset>

              <Fieldset legend="Дорогие клиенты">
                <LocalizedInput
                  field="clientsTitle"
                  locale={locale}
                  label="Заголовок"
                  defaultValue={content?.clientsTitle[locale]}
                  disabled={isPending}
                />
                <LocalizedTextarea
                  field="clientsQuote"
                  locale={locale}
                  label="Текст обращения"
                  rows={4}
                  defaultValue={content?.clientsQuote[locale]}
                  disabled={isPending}
                />
              </Fieldset>
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

function Fieldset({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-card border border-brand-black/10 p-5">
      <legend className="px-1 text-sm font-semibold text-brand-black">{legend}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function LocalizedInput({
  field,
  locale,
  label,
  defaultValue,
  disabled,
}: {
  field: string;
  locale: Locale;
  label: string;
  defaultValue?: string;
  disabled: boolean;
}) {
  const name = `${field}_${locale}`;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-brand-black">
        {label}
      </label>
      <Input id={name} name={name} required defaultValue={defaultValue} disabled={disabled} />
    </div>
  );
}

function LocalizedTextarea({
  field,
  locale,
  label,
  hint,
  rows,
  defaultValue,
  disabled,
}: {
  field: string;
  locale: Locale;
  label: string;
  hint?: string;
  rows: number;
  defaultValue?: string;
  disabled: boolean;
}) {
  const name = `${field}_${locale}`;
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-brand-black">
        {label}
      </label>
      <Textarea
        id={name}
        name={name}
        rows={rows}
        required
        defaultValue={defaultValue}
        disabled={disabled}
      />
      {hint ? <p className="mt-1 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function StatFields({
  statKey,
  label,
  stat,
  disabled,
}: {
  statKey: "years" | "projects" | "employees" | "tonnage";
  label: string;
  stat?: { value: number; suffix: string };
  disabled: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-brand-black">{label}</p>
      <div className="flex gap-2">
        <Input
          type="number"
          name={`stat_${statKey}_value`}
          required
          defaultValue={stat?.value}
          disabled={disabled}
          aria-label={`${label} — число`}
        />
        <Input
          name={`stat_${statKey}_suffix`}
          required
          defaultValue={stat?.suffix}
          disabled={disabled}
          className="w-16"
          aria-label={`${label} — суффикс`}
        />
      </div>
    </div>
  );
}
