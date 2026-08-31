"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Trash2 } from "lucide-react";

import { SchemeEditor, type SchemeDraft } from "@/components/admin/calculator/scheme-editor";
import { SchemeView } from "@/components/calculator/scheme-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  createSchemeAction,
  deleteSchemeAction,
  reorderSchemesAction,
  updateSchemeAction,
  type AdminSchemeDto,
} from "@/components/admin-sections/calculator-schemes-actions";
import { countColumns } from "@/lib/scheme-edit";
import type { ConstructionKind } from "@/lib/scheme-geometry";
import { cn } from "@/lib/utils";

const NEW_DRAFT: SchemeDraft = {
  key: "",
  kind: "window",
  arch: null,
  geometry: { opening: "fixed", hinge: null },
  defaultWidthMm: 1400,
  defaultHeightMm: 1400,
  enabled: true,
};

type Filter = "all" | ConstructionKind;

/**
 * The scheme list, and the constructor that edits one.
 *
 * `enabled` is what makes this list safe to leave alone: retiring a scheme is
 * a toggle, not a delete, so the geometry survives and the public calculator
 * simply stops offering it. Deleting is for schemes that were authored by
 * mistake.
 */
export function SchemesManager({ initialSchemes }: { initialSchemes: AdminSchemeDto[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [schemes, setSchemes] = useState(initialSchemes);
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<{ id: number | null; draft: SchemeDraft } | null>(null);
  const [isPending, startTransition] = useTransition();

  const visible = useMemo(
    () => (filter === "all" ? schemes : schemes.filter((s) => s.kind === filter)),
    [schemes, filter],
  );

  function refresh(next: AdminSchemeDto) {
    setSchemes((current) => {
      const found = current.some((s) => s.id === next.id);
      return found ? current.map((s) => (s.id === next.id ? next : s)) : [...current, next];
    });
  }

  function toggleEnabled(scheme: AdminSchemeDto) {
    startTransition(async () => {
      const next = !scheme.enabled;
      setSchemes((current) =>
        current.map((s) => (s.id === scheme.id ? { ...s, enabled: next } : s)),
      );
      const result = await updateSchemeAction(scheme.id, { enabled: next });
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  function remove(scheme: AdminSchemeDto) {
    if (!window.confirm(`Удалить схему «${scheme.key}» насовсем? Обычно достаточно скрыть её.`))
      return;

    startTransition(async () => {
      setSchemes((current) => current.filter((s) => s.id !== scheme.id));
      const result = await deleteSchemeAction(scheme.id);
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  function move(scheme: AdminSchemeDto, direction: -1 | 1) {
    const index = schemes.findIndex((s) => s.id === scheme.id);
    const target = index + direction;
    if (target < 0 || target >= schemes.length) return;

    const reordered = schemes.slice();
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    startTransition(async () => {
      setSchemes(reordered);
      const result = await reorderSchemesAction(reordered.map((s) => s.id));
      if (!result.success) {
        showToast(result.error);
        router.refresh();
      }
    });
  }

  function save() {
    if (!editing) return;
    const { id, draft } = editing;

    if (!draft.key.trim()) {
      showToast("Укажите ключ схемы");
      return;
    }

    startTransition(async () => {
      const result = id
        ? await updateSchemeAction(id, {
            kind: draft.kind,
            arch: draft.arch,
            geometry: draft.geometry,
            defaultWidthMm: draft.defaultWidthMm,
            defaultHeightMm: draft.defaultHeightMm,
            enabled: draft.enabled,
          })
        : await createSchemeAction(draft);

      if (!result.success) {
        showToast(result.error);
        return;
      }
      refresh(result.data);
      setEditing(null);
      showToast("Схема сохранена", "success");
    });
  }

  return (
    <section className="border-t border-brand-black/10 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-brand-black">Схемы конструкций</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Варианты, которые посетитель выбирает в калькуляторе. Скрытая схема остаётся здесь со
            всей геометрией, но на сайте не показывается.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => setEditing({ id: null, draft: { ...NEW_DRAFT } })}
        >
          <Plus className="size-4" /> Новая схема
        </Button>
      </div>

      {editing ? (
        <div className="mt-6 rounded-card border border-brand-black/15 bg-surface-muted p-5">
          <div className="mb-5 flex flex-wrap items-end gap-4">
            <div className="w-48">
              <label className="mb-1 block text-xs text-neutral-500">
                Ключ {editing.id ? "(нельзя изменить)" : "— латиница, например win_56"}
              </label>
              <Input
                value={editing.draft.key}
                disabled={editing.id !== null}
                placeholder="win_56"
                onChange={(event) =>
                  setEditing({ ...editing, draft: { ...editing.draft, key: event.target.value } })
                }
              />
            </div>
            <label className="flex items-center gap-2 pb-3 text-sm text-brand-black/80">
              <input
                type="checkbox"
                checked={editing.draft.enabled}
                onChange={(event) =>
                  setEditing({
                    ...editing,
                    draft: { ...editing.draft, enabled: event.target.checked },
                  })
                }
                className="size-[18px] accent-brand-red"
              />
              Показывать на сайте
            </label>
          </div>

          <SchemeEditor
            draft={editing.draft}
            onChange={(draft) => setEditing({ ...editing, draft })}
            laminationTexture="/cal/textures/golden-oak.png"
            laminationColor="#9f520e"
          />

          <div className="mt-6 flex gap-2">
            <Button type="button" onClick={save} disabled={isPending}>
              {isPending ? "Сохранение..." : "Сохранить схему"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
              disabled={isPending}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex gap-2">
        {(["all", "window", "door"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === key
                ? "border-brand-black bg-brand-black text-brand-white"
                : "border-brand-black/20 text-brand-black hover:border-brand-black/45",
            )}
          >
            {key === "all" ? "Все" : key === "window" ? "Окна" : "Двери"} (
            {key === "all" ? schemes.length : schemes.filter((s) => s.kind === key).length})
          </button>
        ))}
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((scheme) => (
          <li
            key={scheme.id}
            className={cn(
              "rounded-card border p-3",
              scheme.enabled ? "border-brand-black/10" : "border-dashed border-brand-black/25",
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "h-24 w-20 shrink-0 rounded-control bg-surface p-1.5",
                  !scheme.enabled && "opacity-45",
                )}
              >
                <SchemeView
                  scheme={scheme}
                  widthMm={scheme.defaultWidthMm}
                  heightMm={scheme.defaultHeightMm}
                  laminationTexture="/cal/textures/golden-oak.png"
                  laminationColor="#9f520e"
                  hardwareColor="#f2f2f0"
                  title={scheme.key}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-semibold text-brand-black">{scheme.key}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {scheme.kind === "door" ? "Дверь" : "Окно"} · {countColumns(scheme.geometry)} в
                  ряд{scheme.arch ? " · арка" : ""} · {scheme.defaultWidthMm}×
                  {scheme.defaultHeightMm}
                </p>

                <div className="mt-2 flex flex-wrap gap-1">
                  <IconButton
                    label={scheme.enabled ? "Скрыть на сайте" : "Показать на сайте"}
                    onClick={() => toggleEnabled(scheme)}
                    disabled={isPending}
                  >
                    {scheme.enabled ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                  </IconButton>
                  <IconButton label="Выше" onClick={() => move(scheme, -1)} disabled={isPending}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Ниже" onClick={() => move(scheme, 1)} disabled={isPending}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                  <IconButton label="Удалить" onClick={() => remove(scheme)} disabled={isPending}>
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditing({
                      id: scheme.id,
                      draft: {
                        key: scheme.key,
                        kind: scheme.kind,
                        arch: scheme.arch,
                        geometry: scheme.geometry,
                        defaultWidthMm: scheme.defaultWidthMm,
                        defaultHeightMm: scheme.defaultHeightMm,
                        enabled: scheme.enabled,
                      },
                    })
                  }
                  className="mt-2 text-sm font-medium text-brand-red underline-offset-2 hover:underline"
                >
                  Редактировать
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center rounded-control text-brand-black/45 transition-colors hover:bg-brand-black/5 hover:text-brand-black disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
