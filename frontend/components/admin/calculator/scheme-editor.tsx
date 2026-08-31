"use client";

import { useState } from "react";
import { Columns2, Rows2, Trash2, Undo2 } from "lucide-react";

import { SchemeView } from "@/components/calculator/scheme-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  countColumns,
  nodeAt,
  removeAt,
  setHingeAt,
  setOpeningAt,
  setWeightAt,
  splitAt,
} from "@/lib/scheme-edit";
import {
  isSplit,
  type ConstructionKind,
  type Hinge,
  type OpeningType,
  type SchemeNode,
} from "@/lib/scheme-geometry";
import { cn } from "@/lib/utils";

const OPENING_LABELS: Record<OpeningType, string> = {
  fixed: "Глухая",
  casement: "Поворотная",
  tilt: "Откидная",
  "tilt-turn": "Поворотно-откидная",
};

const HINGE_LABELS: Record<Hinge, string> = {
  left: "Слева",
  right: "Справа",
  bottom: "Снизу",
};

export interface SchemeDraft {
  key: string;
  kind: ConstructionKind;
  arch: number | null;
  geometry: SchemeNode;
  defaultWidthMm: number;
  defaultHeightMm: number;
  enabled: boolean;
}

/**
 * The scheme constructor.
 *
 * The canvas is `SchemeView` — the same renderer the public calculator uses,
 * not a simplified stand-in. That is deliberate: a separate editor canvas
 * would be a second implementation of the geometry, free to drift from what
 * visitors actually see, and the whole point of declared geometry is that
 * there is one answer to "what does this scheme look like".
 *
 * Editing is click-a-cell-then-act rather than drag-and-drop. The operations
 * are guillotine cuts on a tree (`lib/scheme-edit.ts`), so "split this cell in
 * two" is the honest verb; dragging edges would imply a freedom the model does
 * not have and cannot express.
 */
export function SchemeEditor({
  draft,
  onChange,
  laminationTexture,
  laminationColor,
}: {
  draft: SchemeDraft;
  onChange: (draft: SchemeDraft) => void;
  laminationTexture: string | null;
  laminationColor: string;
}) {
  const [selected, setSelected] = useState<number[] | null>([]);
  // Every edit pushes the previous tree, so a mis-click is one button away
  // from undone. Bounded because an editing session can run long and the
  // trees, while small, are not free.
  const [history, setHistory] = useState<SchemeNode[]>([]);

  // Drawn at the scheme's own default size — the size a visitor will actually
  // first see it at. That makes the two size fields below a live control
  // rather than a pair of numbers whose effect the admin has to imagine.
  const previewWidth = draft.defaultWidthMm;
  const previewHeight = draft.defaultHeightMm;

  const selectedNode = selected ? nodeAt(draft.geometry, selected) : null;
  const selectedLeaf = selectedNode && !isSplit(selectedNode) ? selectedNode : null;

  function edit(next: SchemeNode) {
    setHistory((current) => [...current.slice(-19), draft.geometry]);
    onChange({ ...draft, geometry: next });
  }

  function undo() {
    setHistory((current) => {
      if (current.length === 0) return current;
      onChange({ ...draft, geometry: current[current.length - 1] });
      return current.slice(0, -1);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <div className="flex h-[26rem] items-center justify-center rounded-card border border-brand-black/10 bg-surface p-4">
          <SchemeView
            scheme={{
              key: draft.key || "draft",
              kind: draft.kind,
              columns: countColumns(draft.geometry),
              arch: draft.arch,
              defaultWidthMm: draft.defaultWidthMm,
              defaultHeightMm: draft.defaultHeightMm,
              geometry: draft.geometry,
            }}
            widthMm={previewWidth}
            heightMm={previewHeight}
            laminationTexture={laminationTexture}
            laminationColor={laminationColor}
            hardwareColor="#f2f2f0"
            dimensions
            selectedPath={selected}
            onSelectPane={setSelected}
          />
        </div>
        <p className="mt-3 text-sm text-neutral-500">
          Нажмите на створку в чертеже, чтобы выбрать её. Превью — тот же рендер, что видит
          посетитель, и в том самом размере по умолчанию, что задан справа.
        </p>
      </div>

      <div className="space-y-5">
        <Field label="Тип конструкции">
          <Select
            value={draft.kind}
            onChange={(event) =>
              onChange({ ...draft, kind: event.target.value as ConstructionKind })
            }
          >
            <option value="window">Окно</option>
            <option value="door">Дверь</option>
          </Select>
        </Field>

        <Field label="Размер по умолчанию, мм">
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-neutral-500">Ширина</span>
              <Input
                type="number"
                min={100}
                step={10}
                value={draft.defaultWidthMm}
                onChange={(event) =>
                  onChange({ ...draft, defaultWidthMm: Number(event.target.value) || 0 })
                }
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-neutral-500">Высота</span>
              <Input
                type="number"
                min={100}
                step={10}
                value={draft.defaultHeightMm}
                onChange={(event) =>
                  onChange({ ...draft, defaultHeightMm: Number(event.target.value) || 0 })
                }
              />
            </label>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            С этого размера посетитель начинает, выбрав этот вариант. Дальше он двигает ползунки
            сам.
          </p>
        </Field>

        <Field label="Арочное завершение">
          <label className="flex items-center gap-3 text-sm text-brand-black/80">
            <input
              type="checkbox"
              checked={draft.arch !== null}
              onChange={(event) => onChange({ ...draft, arch: event.target.checked ? 0.25 : null })}
              className="size-[18px] accent-brand-red"
            />
            Арка сверху
          </label>
          {draft.arch !== null ? (
            <div className="mt-3">
              <label className="mb-1 block text-xs text-neutral-500">
                Подъём — {Math.round(draft.arch * 100)}% от ширины
              </label>
              <input
                type="range"
                min={5}
                max={60}
                value={Math.round(draft.arch * 100)}
                onChange={(event) => onChange({ ...draft, arch: Number(event.target.value) / 100 })}
                className="w-full accent-brand-red"
              />
            </div>
          ) : null}
        </Field>

        <div className="rounded-card border border-brand-black/10 p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-heading text-sm font-semibold text-brand-black">
              {selectedLeaf ? "Выбранная створка" : "Створка не выбрана"}
            </h4>
            <button
              type="button"
              onClick={undo}
              disabled={history.length === 0}
              title="Отменить последнее действие"
              className="grid size-8 place-items-center rounded-control text-brand-black/45 transition-colors hover:bg-brand-black/5 hover:text-brand-black disabled:pointer-events-none disabled:opacity-40"
            >
              <Undo2 className="size-4" />
            </button>
          </div>

          {selectedLeaf && selected ? (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => edit(splitAt(draft.geometry, selected, "v"))}
                >
                  <Columns2 className="size-4" /> Разделить
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => edit(splitAt(draft.geometry, selected, "h"))}
                >
                  <Rows2 className="size-4" /> Разделить
                </Button>
              </div>

              <div>
                <label className="mb-1 block text-xs text-neutral-500">Открывание</label>
                <Select
                  value={selectedLeaf.opening}
                  onChange={(event) =>
                    edit(setOpeningAt(draft.geometry, selected, event.target.value as OpeningType))
                  }
                >
                  {(Object.keys(OPENING_LABELS) as OpeningType[]).map((key) => (
                    <option key={key} value={key}>
                      {OPENING_LABELS[key]}
                    </option>
                  ))}
                </Select>
              </div>

              {/* A tilt sash is bottom-hung by definition, so offering a side
                  for it would be offering a choice that does not exist. */}
              {selectedLeaf.opening === "casement" || selectedLeaf.opening === "tilt-turn" ? (
                <div>
                  <label className="mb-1 block text-xs text-neutral-500">Петли</label>
                  <Select
                    value={selectedLeaf.hinge ?? "right"}
                    onChange={(event) =>
                      edit(setHingeAt(draft.geometry, selected, event.target.value as Hinge))
                    }
                  >
                    <option value="left">{HINGE_LABELS.left}</option>
                    <option value="right">{HINGE_LABELS.right}</option>
                  </Select>
                </div>
              ) : null}

              {selected.length > 0 ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs text-neutral-500">
                      Доля в ряду (относительная)
                    </label>
                    <Input
                      type="number"
                      min={0.1}
                      step={0.1}
                      value={weightOf(draft.geometry, selected)}
                      onChange={(event) =>
                        onChange({
                          ...draft,
                          geometry: setWeightAt(
                            draft.geometry,
                            selected,
                            Number(event.target.value),
                          ),
                        })
                      }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      edit(removeAt(draft.geometry, selected));
                      setSelected([]);
                    }}
                    className="flex items-center gap-2 text-sm text-brand-black/55 transition-colors hover:text-brand-red"
                  >
                    <Trash2 className="size-4" /> Удалить створку
                  </button>
                </>
              ) : (
                <p className="text-xs text-neutral-500">
                  Это единственная створка — её нельзя удалить, но можно разделить.
                </p>
              )}
            </div>
          ) : (
            <p className="mt-3 text-sm text-neutral-500">Нажмите на створку в чертеже слева.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function weightOf(tree: SchemeNode, path: number[]): number {
  const parent = nodeAt(tree, path.slice(0, -1));
  if (!parent || !isSplit(parent)) return 1;
  return parent.children[path[path.length - 1]]?.weight ?? 1;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={cn("block font-heading text-sm font-semibold text-brand-black")}>{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
