"use client";

import { useOptimistic, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { locales, type Locale } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { AdminContactInterestDto } from "@/components/admin-sections/contact-interests-actions";
import {
  createContactInterestAction,
  deleteContactInterestAction,
  reorderContactInterestsAction,
  updateContactInterestAction,
} from "@/components/admin-sections/contact-interests-actions";

interface ContactInterestsManagerProps {
  initialItems: AdminContactInterestDto[];
}

/**
 * The checkbox options in `ContactsLeadSection`'s "Что вас интересует?" —
 * same list/reorder/edit/delete shape as `AboutTimelineManager`, minus the
 * year/description fields: one option is just a label per locale.
 */
export function ContactInterestsManager({ initialItems }: ContactInterestsManagerProps) {
  const router = useRouter();
  const [items, setItems] = useOptimistic(initialItems);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const reordered = items.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    startTransition(async () => {
      setItems(reordered);
      const result = await reorderContactInterestsAction(reordered.map((item) => item.id));
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  function remove(id: number) {
    if (!window.confirm("Удалить этот пункт?")) return;

    startTransition(async () => {
      setItems(items.filter((item) => item.id !== id));
      const result = await deleteContactInterestAction(id);
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

    startTransition(async () => {
      const result = await createContactInterestAction(formData);
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

    startTransition(async () => {
      const result = await updateContactInterestAction(id, formData);
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
          <h2 className="text-lg font-semibold text-brand-black">Что вас интересует?</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Пункты, которые посетитель может отметить в форме заявки — на каждом языке.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant={showAddForm ? "outline" : "primary"}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "Отмена" : "Добавить пункт"}
        </Button>
      </div>

      {showAddForm ? (
        <form
          onSubmit={submitCreate}
          className="mt-5 rounded-card border border-brand-black/10 p-5"
        >
          <InterestFields disabled={isPending} />
          <Button type="submit" disabled={isPending} className="mt-4">
            {isPending ? "Сохранение..." : "Добавить"}
          </Button>
        </form>
      ) : null}

      <ul className="mt-6 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">Пунктов пока нет.</p>
        ) : (
          items.map((item, index) =>
            editingId === item.id ? (
              <li key={item.id} className="rounded-card border border-brand-black/10 p-5">
                <form onSubmit={(event) => submitEdit(item.id, event)}>
                  <InterestFields disabled={isPending} item={item} />
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
                key={item.id}
                className="flex items-center gap-4 rounded-card border border-brand-black/10 p-4"
              >
                <p className="min-w-0 flex-1 truncate font-medium text-brand-black">
                  {item.label.ru}
                </p>
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
                    disabled={isPending || index === items.length - 1}
                  >
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(item.id)}
                    disabled={isPending}
                  >
                    Изменить
                  </Button>
                  <IconButton
                    label="Удалить"
                    onClick={() => remove(item.id)}
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
    </section>
  );
}

function InterestFields({ disabled, item }: { disabled: boolean; item?: AdminContactInterestDto }) {
  const [activeLocale, setActiveLocale] = useState<Locale>("ru");

  return (
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
            htmlFor={`label_${locale}`}
            className="mb-1.5 block text-sm font-medium text-brand-black"
          >
            Текст
          </label>
          <Input
            id={`label_${locale}`}
            name={`label_${locale}`}
            required
            defaultValue={item?.label[locale]}
            disabled={disabled}
          />
        </div>
      ))}
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
  children: React.ReactNode;
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
