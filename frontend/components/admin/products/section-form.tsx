"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  EMPTY_LOCALIZED,
  LocalizedFields,
  toLocalizedValue,
  type LocalizedValue,
} from "@/components/admin/localized-fields";
import { uploadSectionImageAction } from "@/components/admin-sections/products-actions";

/**
 * The editor for one product-page section, in all four of its shapes.
 *
 * ── Why these four ─────────────────────────────────────────────────────────
 *
 * They are the admin-ordered blocks the product page can draw
 * (`components/products/page/*-section.tsx`), and the payload each form
 * produces is exactly what `backend/app/schemas/product.py` validates. Adding a
 * fifth kind means a payload model on the backend, a form here, and a branch in
 * `ProductPageView` — in that order, and none of the three is optional.
 *
 * There used to be a fifth, `promo`. Every product's payload was
 * byte-identical, so it moved to a block the page renders unconditionally
 * instead — see `ProductPageData.promo` in `types/product-page.ts`.
 *
 * ── Why the forms hold state instead of posting FormData ───────────────────
 *
 * Every section but the gallery nests: a spec table is a list of pairs, each
 * half in four languages; a palette is a list of colour + name + render. A flat
 * `FormData` cannot describe that, so the section endpoints take JSON and these
 * forms build it.
 *
 * ── Why images upload immediately ──────────────────────────────────────────
 *
 * A file input inside a JSON form has nowhere to go. Picking a file uploads it
 * on the spot (`POST /api/products/uploads`) and what lands in the payload is
 * the path it came back with. An image uploaded for a section the admin then
 * abandons is an orphan file — the trade against making every one of these
 * forms multipart, and the delete path cleans up everything a *saved* section
 * references.
 */

export const SECTION_TYPES = [
  {
    value: "finishes",
    label: "Цвета ламинации",
    hint: "Палитра: образец цвета, название и фотография системы в этом цвете.",
  },
  {
    value: "specs",
    label: "Характеристики",
    hint: "Таблица «параметр — значение» и фотография рядом.",
  },
  {
    value: "story",
    label: "Описание системы",
    hint: "Заголовок, несколько абзацев текста и изображение. Тёмный блок.",
  },
  { value: "gallery", label: "Галерея", hint: "Фотографии во всю ширину, слайдером." },
] as const;

export type SectionType = (typeof SECTION_TYPES)[number]["value"];

export function isSectionType(value: string): value is SectionType {
  return SECTION_TYPES.some((type) => type.value === value);
}

export function sectionLabel(type: string): string {
  return SECTION_TYPES.find((item) => item.value === type)?.label ?? type;
}

interface SectionFormProps {
  type: SectionType;
  /** The stored payload when editing; `{}` when adding. */
  initialContent: Record<string, unknown>;
  onSubmit: (content: unknown) => void;
  onCancel: () => void;
  disabled: boolean;
  /** Prefix for `/uploads/…` paths, so previews resolve. See the page. */
  submitLabel: string;
}

export function SectionForm(props: SectionFormProps) {
  switch (props.type) {
    case "finishes":
      return <FinishesForm {...props} />;
    case "specs":
      return <SpecsForm {...props} />;
    case "story":
      return <StoryForm {...props} />;
    case "gallery":
      return <GalleryForm {...props} />;
  }
}

// ── Shared pieces ──────────────────────────────────────────────────────────

function readString(content: Record<string, unknown>, key: string): string | null {
  const value = content[key];
  return typeof value === "string" && value ? value : null;
}

function readArray(content: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = content[key];
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

/** Kept in sync with the backend's own check in `routes/products.py`. */
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * One image slot: pick a file, it uploads, the path it returns becomes the
 * value. `null` is a legitimate value everywhere it is used — a section may
 * simply have no picture.
 */
function ImageField({
  label,
  value,
  onChange,
  disabled,
  optionalHint = "Необязательно.",
}: {
  label: string;
  value: string | null;
  onChange: (path: string | null) => void;
  disabled: boolean;
  optionalHint?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast("Размер файла не должен превышать 10 МБ");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    const result = await uploadSectionImageAction(formData);
    setUploading(false);
    // The input is cleared either way: on success the preview below is the
    // feedback, and on failure a filename sitting in a field that uploaded
    // nothing is the misleading state.
    event.target.value = "";

    if (!result.success) {
      showToast(result.error);
      return;
    }
    onChange(result.data.path);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-brand-black">{label}</label>
      <div className="flex items-start gap-4">
        {value ? (
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              className="h-16 w-24 rounded-control border border-brand-black/10 object-cover"
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={disabled}
              className="mt-1 text-xs text-brand-red hover:underline disabled:opacity-40"
            >
              Убрать
            </button>
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <input
            type="file"
            accept="image/*"
            disabled={disabled || uploading}
            onChange={onFileChange}
            className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-control file:border-0 file:bg-brand-black file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-white hover:file:bg-brand-black/85"
          />
          <p className="mt-1 text-xs text-neutral-500">
            {uploading ? "Загрузка..." : `${optionalHint} До 10 МБ.`}
          </p>
        </div>
      </div>
    </div>
  );
}

/** The frame every section form shares: fields, then Save / Cancel. */
function FormShell({
  onSubmit,
  onCancel,
  disabled,
  submitLabel,
  children,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  disabled: boolean;
  submitLabel: string;
  children: ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      {children}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={disabled}>
          {disabled ? "Сохранение..." : submitLabel}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={disabled}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

/** A repeatable row's controls: move up, move down, delete. */
function RowControls({
  index,
  length,
  onMove,
  onRemove,
  disabled,
  removeDisabled,
}: {
  index: number;
  length: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
  removeDisabled?: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <IconButton label="Выше" onClick={() => onMove(index, -1)} disabled={disabled || index === 0}>
        <ArrowUp className="size-4" />
      </IconButton>
      <IconButton
        label="Ниже"
        onClick={() => onMove(index, 1)}
        disabled={disabled || index === length - 1}
      >
        <ArrowDown className="size-4" />
      </IconButton>
      <IconButton
        label="Удалить"
        onClick={() => onRemove(index)}
        disabled={disabled || removeDisabled}
        tone="danger"
      >
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );
}

export function IconButton({
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
      className={`grid size-9 place-items-center rounded-control transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40 ${
        tone === "danger"
          ? "text-brand-red hover:bg-brand-red/10"
          : "text-brand-black hover:bg-brand-black/5"
      }`}
    >
      {children}
    </button>
  );
}

/** `[a, b, c]` with `index` and `index + direction` swapped, or unchanged. */
function moved<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;

  const next = items.slice();
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// ── Цвета ламинации ────────────────────────────────────────────────────────

interface FinishRow {
  color: string;
  label: LocalizedValue;
  image: string | null;
}

function FinishesForm({
  initialContent,
  onSubmit,
  onCancel,
  disabled,
  submitLabel,
}: SectionFormProps) {
  const [items, setItems] = useState<FinishRow[]>(() => {
    const stored = readArray(initialContent, "items").map((item) => ({
      color: typeof item.color === "string" ? item.color : "#ffffff",
      label: toLocalizedValue(item.label),
      image: typeof item.image === "string" ? item.image : null,
    }));
    return stored.length > 0 ? stored : [{ color: "#ffffff", label: EMPTY_LOCALIZED, image: null }];
  });
  // A palette of one is the case the note exists for («ТОЛЬКО БЕЛЫЙ»), so it
  // starts open when the stored section has one and closed otherwise.
  const [note, setNote] = useState<LocalizedValue | null>(() =>
    initialContent.note ? toLocalizedValue(initialContent.note) : null,
  );

  function patch(index: number, next: Partial<FinishRow>) {
    setItems((current) =>
      current.map((item, position) => (position === index ? { ...item, ...next } : item)),
    );
  }

  return (
    <FormShell
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ items, note });
      }}
      onCancel={onCancel}
      disabled={disabled}
      submitLabel={submitLabel}
    >
      <div className="grid gap-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-card border border-brand-black/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-brand-black">Цвет {index + 1}</p>
              <RowControls
                index={index}
                length={items.length}
                onMove={(position, direction) =>
                  setItems((current) => moved(current, position, direction))
                }
                onRemove={(position) =>
                  setItems((current) => current.filter((_, i) => i !== position))
                }
                disabled={disabled}
                removeDisabled={items.length === 1}
              />
            </div>

            <div className="mt-4 grid gap-4">
              <div className="flex items-end gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-black">
                    Образец
                  </label>
                  <input
                    type="color"
                    value={item.color}
                    disabled={disabled}
                    onChange={(event) => patch(index, { color: event.target.value })}
                    className="h-12 w-16 cursor-pointer rounded-control border border-brand-black/15 bg-surface p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <label className="mb-1.5 block text-xs text-neutral-500">
                    Код цвета — им закрашивается квадратик в палитре
                  </label>
                  <Input
                    value={item.color}
                    disabled={disabled}
                    onChange={(event) => patch(index, { color: event.target.value })}
                  />
                </div>
              </div>

              <LocalizedFields
                label="Название цвета"
                value={item.label}
                onChange={(next) => patch(index, { label: next })}
                disabled={disabled}
              />

              <ImageField
                label="Фотография системы в этом цвете"
                value={item.image}
                onChange={(path) => patch(index, { image: path })}
                disabled={disabled}
                optionalHint="Необязательно — без неё покажется надпись-заглушка."
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() =>
            setItems((current) => [
              ...current,
              { color: "#ffffff", label: EMPTY_LOCALIZED, image: null },
            ])
          }
        >
          Добавить цвет
        </Button>
      </div>

      {note ? (
        <div className="rounded-card border border-brand-black/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-medium text-brand-black">Пояснение под палитрой</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={disabled}
              onClick={() => setNote(null)}
            >
              Убрать
            </Button>
          </div>
          <div className="mt-4">
            <LocalizedFields
              label="Текст пояснения"
              hint="Например: «Система поставляется только в белом профиле»."
              value={note}
              onChange={setNote}
              disabled={disabled}
              multiline
            />
          </div>
        </div>
      ) : (
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled}
            onClick={() => setNote(EMPTY_LOCALIZED)}
          >
            Добавить пояснение
          </Button>
        </div>
      )}
    </FormShell>
  );
}

// ── Характеристики ─────────────────────────────────────────────────────────

interface SpecRow {
  name: LocalizedValue;
  value: LocalizedValue;
}

function SpecsForm({
  initialContent,
  onSubmit,
  onCancel,
  disabled,
  submitLabel,
}: SectionFormProps) {
  const [title, setTitle] = useState<LocalizedValue>(() => toLocalizedValue(initialContent.title));
  const [image, setImage] = useState<string | null>(() => readString(initialContent, "image"));
  const [rows, setRows] = useState<SpecRow[]>(() => {
    const stored = readArray(initialContent, "rows").map((row) => ({
      name: toLocalizedValue(row.name),
      value: toLocalizedValue(row.value),
    }));
    return stored.length > 0 ? stored : [{ name: EMPTY_LOCALIZED, value: EMPTY_LOCALIZED }];
  });

  function patch(index: number, next: Partial<SpecRow>) {
    setRows((current) =>
      current.map((row, position) => (position === index ? { ...row, ...next } : row)),
    );
  }

  return (
    <FormShell
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ title, image, rows });
      }}
      onCancel={onCancel}
      disabled={disabled}
      submitLabel={submitLabel}
    >
      <LocalizedFields
        label="Заголовок блока"
        value={title}
        onChange={setTitle}
        disabled={disabled}
      />

      <ImageField
        label="Изображение рядом с таблицей"
        value={image}
        onChange={setImage}
        disabled={disabled}
      />

      <div className="grid gap-4">
        {rows.map((row, index) => (
          <div key={index} className="rounded-card border border-brand-black/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-brand-black">Строка {index + 1}</p>
              <RowControls
                index={index}
                length={rows.length}
                onMove={(position, direction) =>
                  setRows((current) => moved(current, position, direction))
                }
                onRemove={(position) =>
                  setRows((current) => current.filter((_, i) => i !== position))
                }
                disabled={disabled}
                removeDisabled={rows.length === 1}
              />
            </div>
            <div className="mt-4 grid gap-4">
              <LocalizedFields
                label="Параметр"
                value={row.name}
                onChange={(next) => patch(index, { name: next })}
                disabled={disabled}
              />
              <LocalizedFields
                label="Значение"
                value={row.value}
                onChange={(next) => patch(index, { value: next })}
                disabled={disabled}
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() =>
            setRows((current) => [...current, { name: EMPTY_LOCALIZED, value: EMPTY_LOCALIZED }])
          }
        >
          Добавить строку
        </Button>
      </div>
    </FormShell>
  );
}

// ── Описание системы ───────────────────────────────────────────────────────

function StoryForm({
  initialContent,
  onSubmit,
  onCancel,
  disabled,
  submitLabel,
}: SectionFormProps) {
  const [title, setTitle] = useState<LocalizedValue>(() => toLocalizedValue(initialContent.title));
  const [image, setImage] = useState<string | null>(() => readString(initialContent, "image"));
  const [paragraphs, setParagraphs] = useState<LocalizedValue[]>(() => {
    const stored = Array.isArray(initialContent.paragraphs)
      ? (initialContent.paragraphs as unknown[]).map(toLocalizedValue)
      : [];
    return stored.length > 0 ? stored : [EMPTY_LOCALIZED];
  });

  return (
    <FormShell
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ title, image, paragraphs });
      }}
      onCancel={onCancel}
      disabled={disabled}
      submitLabel={submitLabel}
    >
      <LocalizedFields label="Заголовок" value={title} onChange={setTitle} disabled={disabled} />

      <ImageField
        label="Изображение справа от текста"
        value={image}
        onChange={setImage}
        disabled={disabled}
      />

      <div className="grid gap-4">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="rounded-card border border-brand-black/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <p className="text-sm font-medium text-brand-black">Абзац {index + 1}</p>
              <RowControls
                index={index}
                length={paragraphs.length}
                onMove={(position, direction) =>
                  setParagraphs((current) => moved(current, position, direction))
                }
                onRemove={(position) =>
                  setParagraphs((current) => current.filter((_, i) => i !== position))
                }
                disabled={disabled}
                removeDisabled={paragraphs.length === 1}
              />
            </div>
            <div className="mt-4">
              <LocalizedFields
                label={`Текст абзаца ${index + 1}`}
                value={paragraph}
                onChange={(next) =>
                  setParagraphs((current) =>
                    current.map((item, position) => (position === index ? next : item)),
                  )
                }
                disabled={disabled}
                multiline
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() => setParagraphs((current) => [...current, EMPTY_LOCALIZED])}
        >
          Добавить абзац
        </Button>
      </div>
    </FormShell>
  );
}

// ── Галерея ────────────────────────────────────────────────────────────────

function GalleryForm({
  initialContent,
  onSubmit,
  onCancel,
  disabled,
  submitLabel,
}: SectionFormProps) {
  const [images, setImages] = useState<string[]>(() =>
    Array.isArray(initialContent.images)
      ? (initialContent.images as unknown[]).filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  );
  const { showToast } = useToast();

  return (
    <FormShell
      onSubmit={(event) => {
        event.preventDefault();
        if (images.length === 0) {
          showToast("Добавьте хотя бы одну фотографию");
          return;
        }
        onSubmit({ images });
      }}
      onCancel={onCancel}
      disabled={disabled}
      submitLabel={submitLabel}
    >
      {images.length > 0 ? (
        <ul className="grid gap-3">
          {images.map((image, index) => (
            <li
              key={`${image}-${index}`}
              className="flex items-center gap-4 rounded-card border border-brand-black/10 p-3"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="h-16 w-24 shrink-0 rounded-control object-cover" />
              <p className="min-w-0 flex-1 truncate text-sm text-neutral-500">Фото {index + 1}</p>
              <RowControls
                index={index}
                length={images.length}
                onMove={(position, direction) =>
                  setImages((current) => moved(current, position, direction))
                }
                onRemove={(position) =>
                  setImages((current) => current.filter((_, i) => i !== position))
                }
                disabled={disabled}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-500">Фотографий пока нет.</p>
      )}

      {/* The slot is always empty: it appends rather than replaces, so the
          admin can add photographs one after another without clearing it. */}
      <ImageField
        label="Добавить фотографию"
        value={null}
        onChange={(path) => {
          if (path) setImages((current) => [...current, path]);
        }}
        disabled={disabled}
        optionalHint="Фотографии показываются слайдером, в этом порядке."
      />
    </FormShell>
  );
}
