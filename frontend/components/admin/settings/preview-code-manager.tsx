"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { updatePreviewCodeAction } from "@/components/admin-sections/settings-actions";

/**
 * «Код доступа» — the code that gets a chosen visitor past the «Сайт в
 * разработке» placeholder and onto the real site.
 *
 * Behind a «Сохранить» button, unlike the toggle above it: this is a text
 * field, and saving on every keystroke would hand out a working half-typed
 * code and lock out whoever is holding the finished one.
 *
 * Shown in plain text rather than as a password field on purpose — the point
 * of this value is to be read off the screen and passed on, and it is stored
 * unhashed for the same reason (see the model's comment). It is a door code
 * for a preview, not a credential: it opens nothing in `/admin`.
 */
export function PreviewCodeManager({ initialCode }: { initialCode: string | null }) {
  const [code, setCode] = useState(initialCode ?? "");
  // What is actually saved on the backend, so the button can tell an edited
  // field from an untouched one.
  const [savedCode, setSavedCode] = useState(initialCode ?? "");
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const dirty = code.trim() !== savedCode;

  function save() {
    const next = code.trim();

    if (!next && savedCode && !window.confirm("Удалить код доступа? Заглушку больше не открыть.")) {
      return;
    }

    startTransition(async () => {
      const result = await updatePreviewCodeAction(next);
      if (!result.success) {
        showToast(result.error);
        return;
      }
      setSavedCode(next);
      setCode(next);
      showToast(next ? "Код доступа сохранён" : "Код доступа удалён", "success");
    });
  }

  return (
    <section className="border-t border-brand-black/10 pt-8">
      <div>
        <h2 className="text-lg font-semibold text-brand-black">Код доступа к сайту</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Пока включён режим разработки, посетитель с этим кодом может открыть сайт: на заглушке
          нужно нажать на блок с логотипом и ввести код. Пустое поле — доступа нет ни у кого.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <label htmlFor="preview-code" className="text-sm font-medium text-brand-black">
            Код
          </label>
          <Input
            id="preview-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Например, ROLLER2026"
            autoComplete="off"
            spellCheck={false}
            maxLength={64}
            disabled={isPending}
            className="mt-1.5"
          />
        </div>

        <Button type="button" onClick={save} disabled={isPending || !dirty}>
          {isPending ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm text-neutral-500">
        <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
        {savedCode
          ? "Смена или удаление кода сразу закрывает сайт для всех, кто вошёл по старому коду."
          : "Код не задан — заглушку сейчас нельзя открыть."}
      </p>
    </section>
  );
}
