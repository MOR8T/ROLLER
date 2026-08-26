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
import type { AdminShowroomDto } from "@/app/admin/(dashboard)/showrooms-actions";
import {
  createShowroomAction,
  deleteShowroomAction,
  reorderShowroomsAction,
  updateShowroomAction,
} from "@/app/admin/(dashboard)/showrooms-actions";

interface ShowroomsManagerProps {
  initialShowrooms: AdminShowroomDto[];
}

/** Kept in sync with the backend's own check in `routes/showrooms.py`. */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function imageTooLarge(formData: FormData): boolean {
  const file = formData.get("photo");
  return file instanceof File && file.size > MAX_IMAGE_SIZE_BYTES;
}

/**
 * `/`, `/showroom`, and the map on both, read whatever this list holds, in
 * this order — see `lib/showrooms.ts` (public read) and
 * `showrooms-actions.ts` (the mutations below, which revalidate both this
 * page and the public sections' tagged fetch on success).
 *
 * Reordering is optimistic (`useOptimistic`), same as `PartnersManager` and
 * `ProductCategoriesManager`; create/edit/delete just wait for the round
 * trip and let the server-refreshed `initialShowrooms` prop carry the result
 * back down.
 */
export function ShowroomsManager({ initialShowrooms }: ShowroomsManagerProps) {
  const router = useRouter();
  const [showrooms, setShowrooms] = useOptimistic(initialShowrooms);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= showrooms.length) return;

    const reordered = showrooms.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setError(null);
    startTransition(async () => {
      setShowrooms(reordered);
      const result = await reorderShowroomsAction(reordered.map((showroom) => showroom.id));
      if (!result.success) {
        setError(result.error);
        // Someone else changed the list in the meantime (edited it in another
        // tab, or a showroom was deleted elsewhere) — pull the real state
        // back in rather than leaving the optimistic reorder showing.
        router.refresh();
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("Удалить этот шоурум?")) return;

    setError(null);
    startTransition(async () => {
      setShowrooms(showrooms.filter((showroom) => showroom.id !== id));
      const result = await deleteShowroomAction(id);
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
      const result = await createShowroomAction(formData);
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
      const result = await updateShowroomAction(id, formData);
      if (!result.success) {
        setError(result.error);
        // A 404 here means the showroom was deleted elsewhere while this
        // form was open — leaving the edit form open on a showroom that no
        // longer exists is exactly the confusing state to avoid, so pull
        // fresh data.
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
          <h2 className="text-lg font-semibold text-brand-black">Шоурумы</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Город, адрес и часы работы на четырёх языках, телефон, координаты на карте, ссылка на
            маршрут и фотография — для каждого шоурума. Показываются на главной странице и на
            странице «Шоурумы».
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showAddForm ? "outline" : "primary"}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Отмена" : "Добавить шоурум"}
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
          className="mt-5 grid gap-4 rounded-card border border-brand-black/10 p-5"
        >
          <ShowroomFields disabled={isPending} />
          <div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Сохранение..." : "Добавить"}
            </Button>
          </div>
        </form>
      ) : null}

      <ul className="mt-6 space-y-3">
        {showrooms.length === 0 ? (
          <p className="text-sm text-neutral-500">Шоурумов пока нет.</p>
        ) : (
          showrooms.map((showroom, index) =>
            editingId === showroom.id ? (
              <li key={showroom.id} className="rounded-card border border-brand-black/10 p-5">
                <form
                  onSubmit={(event) => submitEdit(showroom.id, event)}
                  className="grid gap-4"
                >
                  <ShowroomFields disabled={isPending} showroom={showroom} isEdit />
                  <div className="flex gap-2">
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
                key={showroom.id}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 p-3"
              >
                <button
                  type="button"
                  aria-label="Просмотреть фотографию"
                  onClick={() =>
                    setLightbox({ src: showroom.photoSrc, alt: showroom.cities.ru })
                  }
                  className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={showroom.photoSrc}
                    alt=""
                    className="h-16 w-24 rounded-control border border-brand-black/10 object-cover"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-black">{showroom.cities.ru}</p>
                  <p className="truncate text-sm text-neutral-500">{showroom.addresses.ru}</p>
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
                    disabled={isPending || index === showrooms.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(showroom.id)}
                    disabled={isPending}
                  >
                    Изменить
                  </Button>
                  <IconButton
                    label="Удалить"
                    onClick={() => remove(showroom.id)}
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

function ShowroomFields({
  disabled,
  showroom,
  isEdit = false,
}: {
  disabled: boolean;
  showroom?: AdminShowroomDto;
  isEdit?: boolean;
}) {
  // Starts on the current photo in edit mode, so there is always something to
  // look at; swaps to an object URL for whatever file is picked next, and
  // falls back to the current photo again if that selection is cleared.
  const [preview, setPreview] = useState<string | null>(showroom?.photoSrc ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Object URLs are only ever created here, so this is the one place that
  // needs to release them — on every swap and on unmount.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : (showroom?.photoSrc ?? null);
    });
  }

  return (
    <>
      <LocalizedFieldGroup
        label="Город"
        hint="Название города, переведённое на каждый язык сайта."
        prefix="city"
        values={showroom?.cities}
        disabled={disabled}
      />
      <LocalizedFieldGroup
        label="Адрес"
        hint="Улица и дом — то, что показывается под названием города."
        prefix="address"
        values={showroom?.addresses}
        disabled={disabled}
      />
      <LocalizedFieldGroup
        label="Часы работы"
        hint="Например «Пн–Сб: 08:00–18:00» — своя строка на каждый язык."
        prefix="hours"
        values={showroom?.hours}
        disabled={disabled}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-brand-black">
            Телефон
          </label>
          <Input
            id="phone"
            name="phone"
            required
            placeholder="+992 700 600 700"
            defaultValue={showroom?.phone}
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor="route_url" className="mb-1.5 block text-sm font-medium text-brand-black">
            Ссылка «Проложить маршрут»
          </label>
          <Input
            id="route_url"
            name="route_url"
            type="url"
            required
            placeholder="https://yandex.tj/maps/..."
            defaultValue={showroom?.routeUrl}
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor="lat" className="mb-1.5 block text-sm font-medium text-brand-black">
            Широта (lat)
          </label>
          <Input
            id="lat"
            name="lat"
            type="number"
            step="any"
            required
            placeholder="38.546627"
            defaultValue={showroom?.lat}
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor="lng" className="mb-1.5 block text-sm font-medium text-brand-black">
            Долгота (lng)
          </label>
          <Input
            id="lng"
            name="lng"
            type="number"
            step="any"
            required
            placeholder="68.776126"
            defaultValue={showroom?.lng}
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Фотография</label>
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
              name="photo"
              accept="image/*"
              required={!isEdit}
              disabled={disabled}
              onChange={onPhotoChange}
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

/** One field per locale, sharing a `name_<locale>`-style prefix — the shape
 * every `Form(...)` field on the backend expects for city/address/hours. */
function LocalizedFieldGroup({
  label,
  hint,
  prefix,
  values,
  disabled,
}: {
  label: string;
  hint: string;
  prefix: string;
  values?: Record<string, string>;
  disabled: boolean;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-brand-black">{label}</p>
      <p className="mb-2 text-xs text-neutral-500">{hint}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {locales.map((locale) => (
          <div key={locale}>
            <label
              htmlFor={`${prefix}_${locale}`}
              className="mb-1 flex items-center gap-1.5 text-xs font-medium text-neutral-500 uppercase"
            >
              {locale}
              <span className="font-normal text-neutral-400 normal-case">
                · {localeLabels[locale]}
              </span>
            </label>
            <Input
              id={`${prefix}_${locale}`}
              name={`${prefix}_${locale}`}
              required
              defaultValue={values?.[locale]}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
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
