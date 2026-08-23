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
import type { AdminPartnerDto } from "@/app/admin/(dashboard)/partners-actions";
import {
  createPartnerAction,
  deletePartnerAction,
  reorderPartnersAction,
  updatePartnerAction,
} from "@/app/admin/(dashboard)/partners-actions";

interface PartnersManagerProps {
  initialPartners: AdminPartnerDto[];
}

/** Kept in sync with the backend's own check in `routes/partners.py`. */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function imageTooLarge(formData: FormData): boolean {
  const file = formData.get("logo");
  return file instanceof File && file.size > MAX_IMAGE_SIZE_BYTES;
}

/**
 * The strip on `/` and `/about` reads whatever this list holds, in this
 * order — see `lib/partners.ts` (public read) and `partners-actions.ts`
 * (the mutations below, which revalidate both this page and the public
 * sections' tagged fetch on success).
 *
 * Reordering is optimistic (`useOptimistic`), same as `HeroSlidesManager`,
 * since it is the one action whose whole point is instant visual feedback;
 * create/edit/delete just wait for the round trip and let the
 * server-refreshed `initialPartners` prop carry the result back down.
 */
export function PartnersManager({ initialPartners }: PartnersManagerProps) {
  const router = useRouter();
  const [partners, setPartners] = useOptimistic(initialPartners);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= partners.length) return;

    const reordered = partners.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    setError(null);
    startTransition(async () => {
      setPartners(reordered);
      const result = await reorderPartnersAction(reordered.map((partner) => partner.id));
      if (!result.success) {
        setError(result.error);
        // Someone else changed the list in the meantime (edited it in another
        // tab, or a partner was deleted elsewhere) — pull the real state back
        // in rather than leaving the optimistic reorder showing.
        router.refresh();
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("Удалить этого партнёра?")) return;

    setError(null);
    startTransition(async () => {
      setPartners(partners.filter((partner) => partner.id !== id));
      const result = await deletePartnerAction(id);
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
      const result = await createPartnerAction(formData);
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
      const result = await updatePartnerAction(id, formData);
      if (!result.success) {
        setError(result.error);
        // A 404 here means the partner was deleted elsewhere while this
        // form was open — leaving the edit form open on a partner that no
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
          <h2 className="text-lg font-semibold text-brand-black">Партнёры</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Логотип и название — по одному на каждого партнёра. Показываются лентой на главной
            странице и на странице «О компании».
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showAddForm ? "outline" : "primary"}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Отмена" : "Добавить партнёра"}
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
          <PartnerFields disabled={isPending} />
          <div className="sm:col-span-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Сохранение..." : "Добавить"}
            </Button>
          </div>
        </form>
      ) : null}

      <ul className="mt-6 space-y-3">
        {partners.length === 0 ? (
          <p className="text-sm text-neutral-500">Партнёров пока нет.</p>
        ) : (
          partners.map((partner, index) =>
            editingId === partner.id ? (
              <li key={partner.id} className="rounded-card border border-brand-black/10 p-5">
                <form
                  onSubmit={(event) => submitEdit(partner.id, event)}
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <PartnerFields disabled={isPending} partner={partner} isEdit />
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
                key={partner.id}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 p-3"
              >
                <button
                  type="button"
                  aria-label="Просмотреть логотип"
                  onClick={() => setLightbox({ src: partner.logoSrc, alt: partner.name })}
                  className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.logoSrc}
                    alt=""
                    className="h-16 w-24 rounded-control border border-brand-black/10 object-contain p-2"
                  />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-brand-black">{partner.name}</p>
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
                    disabled={isPending || index === partners.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(partner.id)}
                    disabled={isPending}
                  >
                    Изменить
                  </Button>
                  <IconButton
                    label="Удалить"
                    onClick={() => remove(partner.id)}
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

function PartnerFields({
  disabled,
  partner,
  isEdit = false,
}: {
  disabled: boolean;
  partner?: AdminPartnerDto;
  isEdit?: boolean;
}) {
  // Starts on the current logo in edit mode, so there is always something to
  // look at; swaps to an object URL for whatever file is picked next, and
  // falls back to the current logo again if that selection is cleared.
  const [preview, setPreview] = useState<string | null>(partner?.logoSrc ?? null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Object URLs are only ever created here, so this is the one place that
  // needs to release them — on every swap and on unmount.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview((current) => {
      if (current?.startsWith("blob:")) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : (partner?.logoSrc ?? null);
    });
  }

  return (
    <>
      <div className="sm:col-span-2">
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-brand-black">
          Название партнёра
        </label>
        <Input id="name" name="name" required defaultValue={partner?.name} disabled={disabled} />
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1.5 block text-sm font-medium text-brand-black">Логотип</label>
        <div className="flex items-start gap-4">
          {preview ? (
            <button
              type="button"
              aria-label="Просмотреть логотип"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 cursor-zoom-in rounded-control transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt=""
                className="h-16 w-24 rounded-control border border-brand-black/10 object-contain p-2"
              />
            </button>
          ) : null}
          <div className="min-w-0 flex-1">
            <input
              type="file"
              name="logo"
              accept="image/*"
              required={!isEdit}
              disabled={disabled}
              onChange={onLogoChange}
              className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-control file:border-0 file:bg-brand-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-white hover:file:bg-brand-black/85"
            />
            <p className="mt-1 text-xs text-neutral-500">
              {isEdit ? "Оставьте пустым, чтобы не менять логотип. " : ""}До 10 МБ.
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
