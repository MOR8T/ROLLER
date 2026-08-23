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
import { cn } from "@/lib/utils";
import { locales } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import type { AdminHeroSlideDto } from "@/app/admin/(dashboard)/hero-slides-actions";
import {
  createHeroSlideAction,
  deleteHeroSlideAction,
  reorderHeroSlidesAction,
  updateHeroSlideAction,
} from "@/app/admin/(dashboard)/hero-slides-actions";

interface HeroSlidesManagerProps {
  initialSlides: AdminHeroSlideDto[];
}

/** Kept in sync with the backend's own check in `routes/hero_slides.py`. */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function imageTooLarge(formData: FormData): boolean {
  const file = formData.get("image");
  return file instanceof File && file.size > MAX_IMAGE_SIZE_BYTES;
}

/**
 * The slider on `/` reads whatever this list holds — see `lib/hero-slides.ts`
 * (public read) and `hero-slides-actions.ts` (the mutations below, which
 * revalidate both this page and the homepage's tagged fetch on success).
 *
 * Reordering is optimistic (`useOptimistic`) since it is the one action
 * whose whole point is instant visual feedback; create/edit/delete just wait
 * for the round trip and let the server-refreshed `initialSlides` prop carry
 * the result back down.
 */
export function HeroSlidesManager({ initialSlides }: HeroSlidesManagerProps) {
  const router = useRouter();
  const [slides, setSlides] = useOptimistic(initialSlides);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;

    const reordered = slides.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setError(null);
    startTransition(async () => {
      setSlides(reordered);
      const result = await reorderHeroSlidesAction(reordered.map((slide) => slide.id));
      if (!result.success) {
        setError(result.error);
        // Someone else changed the list in the meantime (edited it in another
        // tab, or a slide was deleted elsewhere) — pull the real state back
        // in rather than leaving the optimistic reorder showing.
        router.refresh();
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("Удалить этот слайд?")) return;

    setError(null);
    startTransition(async () => {
      setSlides(slides.filter((slide) => slide.id !== id));
      const result = await deleteHeroSlideAction(id);
      if (!result.success) {
        setError(result.error);
        router.refresh();
      }
    });
  }

  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError(null);
    if (imageTooLarge(formData)) {
      setError("Размер файла не должен превышать 10 МБ");
      return;
    }
    startTransition(async () => {
      const result = await createHeroSlideAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      form.reset();
      setShowAddForm(false);
    });
  }

  function submitEdit(id: number, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError(null);
    if (imageTooLarge(formData)) {
      setError("Размер файла не должен превышать 10 МБ");
      return;
    }
    startTransition(async () => {
      const result = await updateHeroSlideAction(id, formData);
      if (!result.success) {
        setError(result.error);
        // A 404 here means the slide was deleted elsewhere while this form
        // was open — leaving the edit form open on a slide that no longer
        // exists is exactly the confusing state to avoid, so pull fresh data.
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
          <h2 className="text-lg font-semibold text-brand-black">Слайдер главной страницы</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Заголовок на четырёх языках, фотография и ссылка на продукт для каждого слайда — и
            порядок, в котором они показываются.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showAddForm ? "outline" : "primary"}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Отмена" : "Добавить слайд"}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      {showAddForm ? (
        <form
          onSubmit={submitCreate}
          className="mt-5 grid gap-4 rounded-card border border-brand-black/10 p-5 sm:grid-cols-2"
        >
          <SlideFields disabled={isPending} />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Сохранение..." : "Создать слайд"}
            </Button>
          </div>
        </form>
      ) : null}

      <ul className="mt-6 space-y-3">
        {slides.length === 0 ? (
          <p className="text-sm text-neutral-500">Слайдов пока нет.</p>
        ) : (
          slides.map((slide, index) =>
            editingId === slide.id ? (
              <li key={slide.id} className="rounded-card border border-brand-black/10 p-5">
                <form
                  onSubmit={(event) => submitEdit(slide.id, event)}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <SlideFields disabled={isPending} slide={slide} isEdit />
                  <div className="flex gap-2 sm:col-span-2">
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
                key={slide.id}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 p-3"
              >
                <button
                  type="button"
                  aria-label="Просмотреть фотографию"
                  onClick={() => setLightbox({ src: slide.imageSrc, alt: slide.titles.ru })}
                  className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageSrc}
                    alt=""
                    className="h-16 w-24 rounded-control object-cover"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-black">{slide.titles.ru}</p>
                  <p className="truncate text-sm text-neutral-500">{slide.productLink}</p>
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
                    disabled={isPending || index === slides.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(slide.id)}
                    disabled={isPending}
                  >
                    Изменить
                  </Button>
                  <IconButton
                    label="Удалить"
                    onClick={() => remove(slide.id)}
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

function SlideFields({
  disabled,
  slide,
  isEdit = false,
}: {
  disabled: boolean;
  slide?: AdminHeroSlideDto;
  isEdit?: boolean;
}) {
  // Starts on the current photo in edit mode, so there is always something to
  // look at; swaps to an object URL for whatever file is picked next, and
  // falls back to the current photo again if that selection is cleared.
  const [preview, setPreview] = useState<string | null>(slide?.imageSrc ?? null);
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
      return file ? URL.createObjectURL(file) : (slide?.imageSrc ?? null);
    });
  }

  return (
    <>
      <div className="sm:col-span-2">
        <p className="mb-1.5 text-sm font-medium text-brand-black">Заголовок</p>
        <p className="mb-2 text-xs text-neutral-500">
          Один и тот же текст, переведённый на каждый язык сайта — подпись под полем показывает,
          какой это язык.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {locales.map((locale) => (
            <div key={locale}>
              <label
                htmlFor={`title_${locale}`}
                className="mb-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500 uppercase"
              >
                {locale}
                <span className="font-normal text-neutral-400 normal-case">
                  · {localeLabels[locale]}
                </span>
              </label>
              <Input
                id={`title_${locale}`}
                name={`title_${locale}`}
                required
                defaultValue={slide?.titles[locale]}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-brand-black">
          Ссылка на продукт
        </label>
        <Input
          name="product_link"
          required
          placeholder="/products/windows/roller"
          defaultValue={slide?.productLink}
          disabled={disabled}
        />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-brand-black">
          Фотография слайда
        </label>
        <div className="flex items-start gap-4">
          {preview ? (
            <button
              type="button"
              aria-label="Просмотреть фотографию"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="h-16 w-24 rounded-control border border-brand-black/10 object-cover"
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
              {isEdit ? "Оставьте пустым, чтобы не менять фото. " : ""}До 10 МБ.
            </p>
          </div>
        </div>
      </div>

      <ImageLightbox src={previewOpen ? preview : null} onClose={() => setPreviewOpen(false)} />
    </>
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
