"use client";

import {
  useEffect,
  useOptimistic,
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { locales, type Locale } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { AdminAboutCertificateDto } from "@/components/admin-sections/about-certificates-actions";
import {
  createCertificateAction,
  deleteCertificateAction,
  reorderCertificatesAction,
  updateCertificateAction,
} from "@/components/admin-sections/about-certificates-actions";

interface AboutCertificatesManagerProps {
  initialCertificates: AdminAboutCertificateDto[];
}

/** Kept in sync with the backend's own check in `routes/about_certificates.py`. */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function imageTooLarge(formData: FormData): boolean {
  const file = formData.get("image");
  return file instanceof File && file.size > MAX_IMAGE_SIZE_BYTES;
}

/**
 * `/about`'s certificates slider — same list/reorder/edit/delete/image-
 * upload shape as `PartnersManager`, with a locale-tabbed `title` (backs the
 * `alt` text and lightbox caption; the card itself is photo-only) instead of
 * a single untranslated `name`.
 */
export function AboutCertificatesManager({ initialCertificates }: AboutCertificatesManagerProps) {
  const router = useRouter();
  const [certificates, setCertificates] = useOptimistic(initialCertificates);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= certificates.length) return;

    const reordered = certificates.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    startTransition(async () => {
      setCertificates(reordered);
      const result = await reorderCertificatesAction(reordered.map((cert) => cert.id));
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("Удалить этот сертификат?")) return;

    startTransition(async () => {
      setCertificates(certificates.filter((cert) => cert.id !== id));
      const result = await deleteCertificateAction(id);
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (imageTooLarge(formData)) {
      showToast("Размер файла не должен превышать 10 МБ");
      return;
    }
    startTransition(async () => {
      const result = await createCertificateAction(formData);
      if (!result.success) {
        showToast(result.error);
        return;
      }
      form.reset();
      setShowAddForm(false);
    });
  }

  function submitEdit(id: number, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (imageTooLarge(formData)) {
      showToast("Размер файла не должен превышать 10 МБ");
      return;
    }
    startTransition(async () => {
      const result = await updateCertificateAction(id, formData);
      if (!result.success) {
        showToast(result.error);
        router.refresh();
        return;
      }
      setEditingId(null);
    });
  }

  return (
    <section className="mt-10 border-t border-brand-black/10 pt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-black">Сертификаты</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Сканы сертификатов и грамот — фото плюс название на каждом языке (используется как
            подпись при открытии крупно).
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showAddForm ? "outline" : "primary"}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Отмена" : "Добавить сертификат"}
        </Button>
      </div>

      {showAddForm ? (
        <form
          onSubmit={submitCreate}
          className="mt-5 rounded-card border border-brand-black/10 p-5"
        >
          <CertificateFields disabled={isPending} />
          <Button type="submit" disabled={isPending} className="mt-4">
            {isPending ? "Сохранение..." : "Добавить"}
          </Button>
        </form>
      ) : null}

      <ul className="mt-6 space-y-3">
        {certificates.length === 0 ? (
          <p className="text-sm text-neutral-500">Сертификатов пока нет.</p>
        ) : (
          certificates.map((certificate, index) =>
            editingId === certificate.id ? (
              <li key={certificate.id} className="rounded-card border border-brand-black/10 p-5">
                <form onSubmit={(event) => submitEdit(certificate.id, event)}>
                  <CertificateFields disabled={isPending} certificate={certificate} isEdit />
                  <div className="mt-4 flex gap-2">
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending ? "Сохранение..." : "Сохранить"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                      disabled={isPending}
                    >
                      Отмена
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li
                key={certificate.id}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 p-3"
              >
                <button
                  type="button"
                  aria-label="Просмотреть сертификат"
                  onClick={() =>
                    setLightbox({ src: certificate.imageSrc, alt: certificate.title.ru })
                  }
                  className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={certificate.imageSrc}
                    alt=""
                    className="h-20 w-16 rounded-control border border-brand-black/10 object-cover"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-black">{certificate.title.ru}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton
                    label="Выше"
                    onClick={() => move(index, -1)}
                    disabled={isPending || index === 0}
                  >
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton
                    label="Ниже"
                    onClick={() => move(index, 1)}
                    disabled={isPending || index === certificates.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(certificate.id)}
                    disabled={isPending}
                  >
                    Изменить
                  </Button>
                  <IconButton
                    label="Удалить"
                    onClick={() => remove(certificate.id)}
                    disabled={isPending}
                    tone="danger"
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              </li>
            ),
          )
        )}
      </ul>

      <ImageLightbox
        src={lightbox?.src ?? null}
        alt={lightbox?.alt}
        onClose={() => setLightbox(null)}
      />
    </section>
  );
}

function CertificateFields({
  disabled,
  certificate,
  isEdit = false,
}: {
  disabled: boolean;
  certificate?: AdminAboutCertificateDto;
  isEdit?: boolean;
}) {
  const [activeLocale, setActiveLocale] = useState<Locale>("ru");

  // Starts on the current scan in edit mode, so there is always something to
  // look at; swaps to an object URL for whatever file is picked next, and
  // falls back to the current scan again if that selection is cleared.
  const [preview, setPreview] = useState<string | null>(certificate?.imageSrc ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Object URLs are only ever created here, so this is the one place that
  // needs to release them — on every swap and on unmount.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : (certificate?.imageSrc ?? null);
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Скан</label>
        <div className="flex items-start gap-4">
          {preview ? (
            <button
              type="button"
              aria-label="Просмотреть скан"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="h-20 w-16 rounded-control border border-brand-black/10 object-cover"
              />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <input
              type="file"
              name="image"
              accept="image/*"
              required={!isEdit}
              disabled={disabled}
              onChange={onImageChange}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-control file:border-0 file:bg-brand-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-white hover:file:bg-brand-black/85"
            />
            <p className="mt-1 text-xs text-neutral-500">
              {isEdit ? "Оставьте пустым, чтобы не менять скан. " : ""}До 10 МБ.
            </p>
          </div>
        </div>
      </div>

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
          <div key={locale} hidden={activeLocale !== locale} className="pt-4">
            <label
              htmlFor={`title_${locale}`}
              className="mb-1.5 block text-sm font-medium text-brand-black"
            >
              Название
            </label>
            <Input
              id={`title_${locale}`}
              name={`title_${locale}`}
              required
              defaultValue={certificate?.title[locale]}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      <ImageLightbox src={previewOpen ? preview : null} onClose={() => setPreviewOpen(false)} />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  tone = "default",
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-9 place-items-center rounded-control transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40",
        tone === "danger"
          ? "text-brand-red hover:bg-brand-red/10"
          : "text-brand-black hover:bg-brand-black/5",
      )}
    >
      {children}
    </button>
  );
}
