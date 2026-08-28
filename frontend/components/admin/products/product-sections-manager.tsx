"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  IconButton,
  SECTION_TYPES,
  SectionForm,
  isSectionType,
  sectionLabel,
  type SectionType,
} from "@/components/admin/products/section-form";
import {
  createSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
  updateSectionAction,
  type AdminProductSectionDto,
} from "@/components/admin-sections/products-actions";

/**
 * The second half of the client's flow: «после этого админ в самом продукте
 * будет вводить его информацию».
 *
 * The list here *is* the product page, top to bottom. Adding a section appends
 * a block, the arrows move it, and the order is saved to the backend on every
 * move — the public page renders `position` order and nothing else, so what
 * this list shows is what a visitor gets.
 *
 * A type may be used more than once. Two galleries, or a promo block above and
 * below the specs, are legitimate layouts and nothing here treats a kind as a
 * slot that can only be filled once.
 *
 * Reordering is optimistic (`useOptimistic`), same as every other manager in
 * the panel, since it is the one action whose whole point is instant feedback.
 * Add / edit / delete wait for the round trip and let the server-refreshed
 * `initialSections` prop carry the result back down.
 */
export function ProductSectionsManager({
  productId,
  initialSections,
  uploadsBaseUrl,
}: {
  productId: number;
  initialSections: AdminProductSectionDto[];
  /**
   * Where `/uploads/…` paths are served from — `BACKEND_PUBLIC_URL`, read on
   * the server and passed down because it is not a `NEXT_PUBLIC_` variable and
   * this component runs in the browser.
   */
  uploadsBaseUrl: string;
}) {
  const router = useRouter();
  const [sections, setSections] = useOptimistic(initialSections);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [addingType, setAddingType] = useState<SectionType | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;

    const reordered = sections.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    startTransition(async () => {
      setSections(reordered);
      const result = await reorderSectionsAction(
        productId,
        reordered.map((section) => section.id),
      );
      if (!result.success) {
        showToast(result.error);
        // Someone else changed this product in another tab — pull the real
        // state back rather than leaving the optimistic order showing.
        router.refresh();
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("Удалить эту секцию?")) return;

    startTransition(async () => {
      setSections(sections.filter((section) => section.id !== id));
      const result = await deleteSectionAction(productId, id);
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  function create(type: SectionType, content: unknown) {
    startTransition(async () => {
      const result = await createSectionAction(productId, { type, content });
      if (!result.success) {
        showToast(result.error);
        return;
      }
      setAddingType(null);
    });
  }

  function update(sectionId: number, type: string, content: unknown) {
    startTransition(async () => {
      const result = await updateSectionAction(productId, sectionId, { type, content });
      if (!result.success) {
        showToast(result.error);
        return;
      }
      setEditingId(null);
    });
  }

  return (
    <section className="mt-10 border-t border-brand-black/10 pt-8">
      <div>
        <h2 className="text-lg font-semibold text-brand-black">Секции страницы</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Из чего состоит страница продукта. Порядок здесь — это порядок блоков на сайте; фото,
          заголовок и описание из карточки показываются первым экраном и в этот список не входят.
        </p>
      </div>

      <ul className="mt-6 space-y-3">
        {sections.length === 0 ? (
          <p className="text-sm text-neutral-500">Секций пока нет.</p>
        ) : (
          sections.map((section, index) =>
            editingId === section.id ? (
              <li key={section.id} className="rounded-card border border-brand-black/10 p-5">
                <p className="mb-4 text-sm font-medium text-brand-black">
                  {sectionLabel(section.type)}
                </p>
                {isSectionType(section.type) ? (
                  <SectionForm
                    type={section.type}
                    initialContent={section.content}
                    onSubmit={(content) => update(section.id, section.type, content)}
                    onCancel={() => setEditingId(null)}
                    disabled={isPending}
                    uploadsBaseUrl={uploadsBaseUrl}
                    submitLabel="Сохранить"
                  />
                ) : (
                  <p className="text-sm text-brand-red">
                    Неизвестный тип секции — эту секцию можно только удалить.
                  </p>
                )}
              </li>
            ) : (
              <li
                key={section.id}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 p-4"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-control bg-brand-black/5 text-sm font-semibold text-brand-black">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-black">{sectionLabel(section.type)}</p>
                  <p className="mt-0.5 truncate text-xs text-neutral-500">
                    {describeSection(section)}
                  </p>
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
                    disabled={isPending || index === sections.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(section.id)}
                    disabled={isPending}
                  >
                    Изменить
                  </Button>
                  <IconButton
                    label="Удалить"
                    onClick={() => remove(section.id)}
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

      <div className="mt-6 rounded-card border border-dashed border-brand-black/20 p-5">
        {addingType === null ? (
          <>
            <p className="text-sm font-medium text-brand-black">Добавить секцию</p>
            <div className="mt-3 grid gap-3 sm:max-w-md">
              <Select
                aria-label="Тип секции"
                defaultValue=""
                disabled={isPending}
                onChange={(event) => {
                  const value = event.target.value;
                  if (isSectionType(value)) setAddingType(value);
                }}
              >
                <option value="" disabled>
                  Выберите тип секции
                </option>
                {SECTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
              <ul className="space-y-1 text-xs text-neutral-500">
                {SECTION_TYPES.map((type) => (
                  <li key={type.value}>
                    <span className="font-medium text-brand-black/70">{type.label}</span> —{" "}
                    {type.hint}
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-brand-black">
              Новая секция: {sectionLabel(addingType)}
            </p>
            {/* `key` is the type: switching types while the form is open has to
                mount a fresh form rather than reuse the previous one's state. */}
            <SectionForm
              key={addingType}
              type={addingType}
              initialContent={{}}
              onSubmit={(content) => create(addingType, content)}
              onCancel={() => setAddingType(null)}
              disabled={isPending}
              uploadsBaseUrl={uploadsBaseUrl}
              submitLabel="Добавить"
            />
          </>
        )}
      </div>
    </section>
  );
}

/**
 * A one-line summary of what a section holds, so the collapsed list says more
 * than five identical type names.
 */
function describeSection(section: AdminProductSectionDto): string {
  const content = section.content ?? {};

  switch (section.type) {
    case "finishes": {
      const count = Array.isArray(content.items) ? content.items.length : 0;
      return `${count} ${plural(count, "цвет", "цвета", "цветов")}`;
    }
    case "specs": {
      const count = Array.isArray(content.rows) ? content.rows.length : 0;
      return `${count} ${plural(count, "строка", "строки", "строк")}`;
    }
    case "story": {
      const count = Array.isArray(content.paragraphs) ? content.paragraphs.length : 0;
      return `${count} ${plural(count, "абзац", "абзаца", "абзацев")}`;
    }
    case "gallery": {
      const count = Array.isArray(content.images) ? content.images.length : 0;
      return `${count} ${plural(count, "фотография", "фотографии", "фотографий")}`;
    }
    case "promo": {
      const title = (content.title ?? {}) as Record<string, unknown>;
      return String(title.ru ?? "");
    }
    default:
      return "";
  }
}

/** Russian counts need three forms; the admin panel is Russian-only. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;

  const mod10 = count % 10;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
