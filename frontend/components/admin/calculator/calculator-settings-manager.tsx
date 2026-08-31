"use client";

import { useId, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { locales, type Locale } from "@/i18n/routing";
import { localeLabels } from "@/i18n/locale-labels";
import { cn } from "@/lib/utils";
import {
  updateCalculatorSettingsAction,
  uploadLaminationTextureAction,
  type Accessory,
  type CalculatorSettingsDto,
  type Label,
  type LaminationColor,
  type GlazingKey,
  type Mechanism,
  type Range,
  type Series,
} from "@/components/admin-sections/calculator-settings-actions";

const EMPTY_LABEL: Label = { ru: "", tj: "", en: "", tr: "" };

const CONSTRUCTION_LABELS: Record<"window" | "door", string> = {
  window: "Окно",
  door: "Дверь",
};

const MATERIAL_LABELS: Record<"pvc" | "aluminium", string> = {
  pvc: "ПВХ",
  aluminium: "Алюминий",
};

// A closed set, unlike the lists around it: the four are physical products
// (chamber count), not a taxonomy the client edits. What an admin chooses is
// which of them a given series is offered with.
const GLAZING_LABELS: Record<GlazingKey, string> = {
  "single-glass": "Одинарное стекло",
  "single-chamber": "Однокамерный",
  "double-chamber": "Двухкамерный",
  "double-chamber-energy": "Двухкамерный энергосберегающий",
};

/**
 * The calculator's option lists (`data/calculator.ts`'s `mechanisms`,
 * `accessories`, `laminations`, `sizeLimits`), edited here as one JSONB blob
 * and saved with a single PUT — there is no per-item REST endpoint, because
 * every row here is edited as part of the same admin-only list, not as
 * independent content.
 *
 * The lamination palette here *is* what `/calculator` paints with and shows as
 * swatches — one source, so a colour added here appears in both. The other
 * three lists are not read by the public page yet: mechanisms, accessories and
 * size limits still come from `data/calculator.ts`, because each is wired into
 * `reconcile`'s cascade and moving them is its own change.
 */
export function CalculatorSettingsManager({
  initialSettings,
}: {
  initialSettings: CalculatorSettingsDto;
}) {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  function update(patch: Partial<CalculatorSettingsDto>) {
    setSettings((current) => ({ ...current, ...patch }));
    setDirty(true);
  }

  function save() {
    startTransition(async () => {
      const result = await updateCalculatorSettingsAction(settings);
      if (!result.success) {
        showToast(result.error);
        return;
      }
      setSettings(result.data);
      setDirty(false);
      showToast("Сохранено", "success");
    });
  }

  return (
    <div className="mt-8 space-y-10">
      <SeriesSection items={settings.series} onChange={(series) => update({ series })} />
      <MechanismsSection
        items={settings.mechanisms}
        onChange={(mechanisms) => update({ mechanisms })}
      />
      <AccessoriesSection
        items={settings.accessories}
        onChange={(accessories) => update({ accessories })}
      />
      <LaminationSection
        items={settings.laminationColors}
        onChange={(laminationColors) => update({ laminationColors })}
      />
      <SizeLimitsSection
        limits={settings.sizeLimits}
        onChange={(sizeLimits) => update({ sizeLimits })}
      />

      <div className="sticky bottom-4 flex justify-end">
        <Button type="button" onClick={save} disabled={isPending || !dirty}>
          {isPending ? "Сохранение..." : "Сохранить изменения"}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-brand-black/10 pt-8">
      <h2 className="text-lg font-semibold text-brand-black">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{description}</p>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  );
}

/**
 * One name per locale.
 *
 * The locale is captioned above each box, not left to the placeholder: a
 * placeholder disappears the moment the field has a value, and these fields
 * arrive pre-filled — the seed writes the same brand name into all four — so
 * an admin saw four identical, unlabelled boxes and had no way to tell which
 * language they were editing. Four visible captions is the difference between
 * a translatable field and one that only ever gets filled in once.
 */
function LabelFields({ value, onChange }: { value: Label; onChange: (label: Label) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {locales.map((locale: Locale) => (
        <label key={locale} className="block">
          <span className="mb-1 block text-xs text-neutral-500">{localeLabels[locale]}</span>
          <Input
            value={value[locale]}
            aria-label={`Название (${localeLabels[locale]})`}
            onChange={(event) => onChange({ ...value, [locale]: event.target.value })}
          />
        </label>
      ))}
    </div>
  );
}

/**
 * Reordering, which only the series list needs: its order is the order of the
 * select on the site, and the first entry that fits the visitor's material and
 * construction is the one selected by default. The other lists here are
 * unordered sets, so moving an entry in them would change nothing.
 */
function MoveButtons({
  index,
  total,
  onMove,
}: {
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <div className="mt-[26px] flex shrink-0 flex-col">
      <button
        type="button"
        aria-label="Выше"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        className="grid size-[18px] place-items-center text-brand-black/45 transition-colors hover:text-brand-black disabled:opacity-25"
      >
        <ArrowUp className="size-3.5" />
      </button>
      <button
        type="button"
        aria-label="Ниже"
        disabled={index === total - 1}
        onClick={() => onMove(1)}
        className="grid size-[18px] place-items-center text-brand-black/45 transition-colors hover:text-brand-black disabled:opacity-25"
      >
        <ArrowDown className="size-3.5" />
      </button>
    </div>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Удалить"
      onClick={onClick}
      className="mt-[26px] grid size-9 shrink-0 place-items-center rounded-control text-brand-black/45 transition-colors hover:bg-brand-red/10 hover:text-brand-red"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */

function SeriesSection({
  items,
  onChange,
}: {
  items: Series[];
  onChange: (items: Series[]) => void;
}) {
  return (
    <SectionCard
      title="Серии профиля"
      description={
        "Список в поле «Серия профиля». Материал и тип конструкции решают, когда серия " +
        "показывается: посетитель, выбравший алюминиевую дверь, видит только алюминиевые " +
        "серии, доступные для двери. Стеклопакеты — те, с которыми серия продаётся. " +
        "Порядок здесь — это порядок в списке на сайте, и первая подходящая серия выбрана " +
        "по умолчанию."
      }
    >
      {items.map((item, index) => {
        function patch(next: Partial<Series>) {
          const copy = items.slice();
          copy[index] = { ...item, ...next };
          onChange(copy);
        }

        return (
          <div key={index} className="space-y-3 rounded-card border border-brand-black/10 p-3">
            <div className="flex items-start gap-2">
              <label className="block w-32 shrink-0">
                <span className="mb-1 block text-xs text-neutral-500">Ключ</span>
                <Input
                  value={item.key}
                  aria-label="Ключ"
                  onChange={(event) => patch({ key: event.target.value })}
                />
              </label>
              <div className="flex-1">
                <LabelFields value={item.label} onChange={(label) => patch({ label })} />
              </div>
              <MoveButtons
                index={index}
                total={items.length}
                onMove={(direction) => {
                  const target = index + direction;
                  if (target < 0 || target >= items.length) return;
                  const copy = items.slice();
                  [copy[index], copy[target]] = [copy[target], copy[index]];
                  onChange(copy);
                }}
              />
              <RemoveButton onClick={() => onChange(items.filter((_, i) => i !== index))} />
            </div>

            <div className="grid gap-3 pl-1 sm:grid-cols-[10rem_1fr]">
              <div>
                <p className="mb-1 text-xs text-neutral-500">Материал</p>
                <Select
                  value={item.material}
                  aria-label="Материал"
                  onChange={(event) =>
                    patch({ material: event.target.value as Series["material"] })
                  }
                >
                  <option value="pvc">{MATERIAL_LABELS.pvc}</option>
                  <option value="aluminium">{MATERIAL_LABELS.aluminium}</option>
                </Select>
              </div>

              <div>
                <p className="mb-1 text-xs text-neutral-500">Доступна для</p>
                <div className="flex gap-4 pt-2.5">
                  {(["window", "door"] as const).map((kind) => {
                    const checked = item.constructions.includes(kind);
                    return (
                      <label
                        key={kind}
                        className="flex items-center gap-2 text-sm text-brand-black/75"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            patch({
                              constructions: checked
                                ? item.constructions.filter((c) => c !== kind)
                                : [...item.constructions, kind],
                            })
                          }
                          className="size-4 accent-brand-red"
                        />
                        {CONSTRUCTION_LABELS[kind]}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pl-1">
              <p className="mb-1 text-xs text-neutral-500">Стеклопакеты</p>
              <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {(Object.keys(GLAZING_LABELS) as GlazingKey[]).map((key) => {
                  const checked = item.glazing.includes(key);
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm text-brand-black/75"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          patch({
                            glazing: checked
                              ? item.glazing.filter((g) => g !== key)
                              : [...item.glazing, key],
                          })
                        }
                        className="size-4 accent-brand-red"
                      />
                      {GLAZING_LABELS[key]}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...items,
            {
              key: "",
              label: { ...EMPTY_LABEL },
              material: "pvc",
              constructions: ["window"],
              glazing: ["single-chamber"],
            },
          ])
        }
      >
        <Plus className="size-4" /> Добавить серию
      </Button>
    </SectionCard>
  );
}

function MechanismsSection({
  items,
  onChange,
}: {
  items: Mechanism[];
  onChange: (items: Mechanism[]) => void;
}) {
  return (
    <SectionCard
      title="Механизмы"
      description={"Варианты поля «Механизм» в калькуляторе. Ключ — латиницей, без пробелов."}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-2 rounded-card border border-brand-black/10 p-3"
        >
          <label className="block w-32 shrink-0">
            <span className="mb-1 block text-xs text-neutral-500">Ключ</span>
            <Input
              value={item.key}
              aria-label="Ключ"
              onChange={(event) => {
                const next = items.slice();
                next[index] = { ...item, key: event.target.value };
                onChange(next);
              }}
            />
          </label>
          <div className="flex-1">
            <LabelFields
              value={item.label}
              onChange={(label) => {
                const next = items.slice();
                next[index] = { ...item, label };
                onChange(next);
              }}
            />
          </div>
          <RemoveButton onClick={() => onChange(items.filter((_, i) => i !== index))} />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { key: "", label: { ...EMPTY_LABEL } }])}
      >
        <Plus className="size-4" /> Добавить механизм
      </Button>
    </SectionCard>
  );
}

function AccessoriesSection({
  items,
  onChange,
}: {
  items: Accessory[];
  onChange: (items: Accessory[]) => void;
}) {
  return (
    <SectionCard
      title="Аксессуары"
      description="Дополнительные опции (подоконник, москитная сетка и т.д.) и для каких конструкций они доступны."
    >
      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-card border border-brand-black/10 p-3">
          <div className="flex items-start gap-2">
            <label className="block w-32 shrink-0">
              <span className="mb-1 block text-xs text-neutral-500">Ключ</span>
              <Input
                value={item.key}
                aria-label="Ключ"
                onChange={(event) => {
                  const next = items.slice();
                  next[index] = { ...item, key: event.target.value };
                  onChange(next);
                }}
              />
            </label>
            <div className="flex-1">
              <LabelFields
                value={item.label}
                onChange={(label) => {
                  const next = items.slice();
                  next[index] = { ...item, label };
                  onChange(next);
                }}
              />
            </div>
            <RemoveButton onClick={() => onChange(items.filter((_, i) => i !== index))} />
          </div>
          <div className="flex gap-4 pl-1">
            {(["window", "door"] as const).map((kind) => {
              const checked = item.constructions.includes(kind);
              return (
                <label key={kind} className="flex items-center gap-2 text-sm text-brand-black/75">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = items.slice();
                      next[index] = {
                        ...item,
                        constructions: checked
                          ? item.constructions.filter((c) => c !== kind)
                          : [...item.constructions, kind],
                      };
                      onChange(next);
                    }}
                    className="size-4 accent-brand-red"
                  />
                  {CONSTRUCTION_LABELS[kind]}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([...items, { key: "", label: { ...EMPTY_LABEL }, constructions: ["window"] }])
        }
      >
        <Plus className="size-4" /> Добавить аксессуар
      </Button>
    </SectionCard>
  );
}

function LaminationSection({
  items,
  onChange,
}: {
  items: LaminationColor[];
  onChange: (items: LaminationColor[]) => void;
}) {
  return (
    <SectionCard
      title="Цвета ламинации"
      description={
        "Палитра ламинации и фурнитуры. Фотография текстуры — то, чем закрашивается профиль в " +
        "калькуляторе; лучше всего подходит горизонтальный снимок доски без бликов и теней. " +
        "Цвет (hex) нужен всё равно: он показывается, пока фотография грузится, и заменяет её, если её нет."
      }
    >
      {items.map((item, index) => (
        <LaminationRow
          key={index}
          item={item}
          onChange={(next) => {
            const copy = items.slice();
            copy[index] = next;
            onChange(copy);
          }}
          onRemove={() => onChange(items.filter((_, i) => i !== index))}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          onChange([
            ...items,
            { key: "", label: { ...EMPTY_LABEL }, hex: "#f2f2f0", texture: null, textureSrc: null },
          ])
        }
      >
        <Plus className="size-4" /> Добавить цвет
      </Button>
    </SectionCard>
  );
}

/**
 * One lamination colour. The texture uploads immediately (it has to — the
 * settings themselves are saved as one JSON body), but the *palette* is only
 * written when the admin presses «Сохранить», so an upload they then abandon
 * changes nothing on the site.
 */
function LaminationRow({
  item,
  onChange,
  onRemove,
}: {
  item: LaminationColor;
  onChange: (item: LaminationColor) => void;
  onRemove: () => void;
}) {
  const { showToast } = useToast();
  const inputId = useId();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    const result = await uploadLaminationTextureAction(formData);
    setUploading(false);

    if (!result.success) {
      showToast(result.error);
      return;
    }

    onChange({ ...item, texture: result.data.path, textureSrc: result.data.src });
    showToast("Текстура загружена — не забудьте сохранить", "success");
  }

  return (
    <div className="rounded-card border border-brand-black/10 p-3">
      <div className="flex items-start gap-2">
        <div
          className="mt-[26px] size-9 shrink-0 rounded-full border border-brand-black/15 bg-cover bg-center"
          style={{
            backgroundColor: item.hex,
            backgroundImage: item.textureSrc ? `url(${item.textureSrc})` : undefined,
          }}
          aria-hidden
        />
        <div className="w-28 shrink-0">
          <Input
            value={item.key}
            aria-label="Ключ"
            onChange={(event) => onChange({ ...item, key: event.target.value })}
          />
        </div>
        <div className="w-28 shrink-0">
          <Input
            value={item.hex}
            aria-label="Цвет (hex)"
            onChange={(event) => onChange({ ...item, hex: event.target.value })}
          />
        </div>
        <div className="flex-1">
          <LabelFields value={item.label} onChange={(label) => onChange({ ...item, label })} />
        </div>
        <RemoveButton onClick={onRemove} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 pl-11">
        {item.textureSrc ? (
          <span
            className="h-9 w-24 shrink-0 rounded-control border border-brand-black/15 bg-cover bg-center"
            style={{ backgroundImage: `url(${item.textureSrc})` }}
            aria-label="Текстура"
            role="img"
          />
        ) : (
          <span className="text-sm text-neutral-500">Фотография текстуры не загружена</span>
        )}

        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Clearing the input lets the same file be picked again after a
            // failed upload — otherwise `change` never fires a second time.
            event.target.value = "";
            if (file) void upload(file);
          }}
        />
        {/* A `<label>` rather than a `<button>`: it has to drive the file
            input, and `Button` renders a real `<button>` that cannot wrap one
            legally. Styled to match `Button variant="outline" size="sm"`. */}
        <label
          htmlFor={inputId}
          className={cn(
            "inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-control border border-brand-black/20 px-4 py-2 text-sm font-medium text-brand-black transition-colors hover:bg-brand-black/5",
            uploading && "pointer-events-none opacity-50",
          )}
        >
          {uploading ? "Загрузка..." : item.textureSrc ? "Заменить текстуру" : "Загрузить текстуру"}
        </label>

        {item.textureSrc ? (
          <button
            type="button"
            onClick={() => onChange({ ...item, texture: null, textureSrc: null })}
            className="text-sm text-brand-black/50 underline-offset-2 transition-colors hover:text-brand-red hover:underline"
          >
            Убрать
          </button>
        ) : null}
      </div>
    </div>
  );
}

function RangeFields({ value, onChange }: { value: Range; onChange: (range: Range) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {(["min", "max", "step", "default"] as const).map((field) => (
        <label key={field} className="block">
          <span className="mb-1 block text-xs text-neutral-500 capitalize">{field}</span>
          <Input
            type="number"
            value={value[field]}
            onChange={(event) => onChange({ ...value, [field]: Number(event.target.value) || 0 })}
          />
        </label>
      ))}
    </div>
  );
}

function SizeLimitsSection({
  limits,
  onChange,
}: {
  limits: CalculatorSettingsDto["sizeLimits"];
  onChange: (limits: CalculatorSettingsDto["sizeLimits"]) => void;
}) {
  return (
    <SectionCard
      title="Размерные лимиты"
      description="Границы ползунков ширины и высоты, в миллиметрах."
    >
      {(["window", "door"] as const).map((kind) => (
        <div key={kind} className="rounded-card border border-brand-black/10 p-4">
          <h3 className="font-medium text-brand-black">{CONSTRUCTION_LABELS[kind]}</h3>
          <div className="mt-3 space-y-3">
            <div>
              <p className="mb-1 text-xs text-neutral-500">Ширина</p>
              <RangeFields
                value={limits[kind].width}
                onChange={(width) => onChange({ ...limits, [kind]: { ...limits[kind], width } })}
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-neutral-500">Высота</p>
              <RangeFields
                value={limits[kind].height}
                onChange={(height) => onChange({ ...limits, [kind]: { ...limits[kind], height } })}
              />
            </div>
          </div>
        </div>
      ))}
    </SectionCard>
  );
}
