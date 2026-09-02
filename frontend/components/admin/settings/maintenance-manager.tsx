"use client";

import { useState, useTransition } from "react";
import { TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { updateMaintenanceModeAction } from "@/components/admin-sections/settings-actions";

/**
 * «Сайт в разработке» — one switch, saved the moment it is flipped rather
 * than behind a «Сохранить» button, because there is nothing to fill in and
 * an admin turning the site off (or back on) wants it to happen now.
 *
 * Turning it *on* asks for confirmation; turning it off does not. The two
 * directions are not equally recoverable from a misclick: switching on hides
 * the whole storefront from visitors, switching off just puts it back.
 */
export function MaintenanceManager({ initialEnabled }: { initialEnabled: boolean | null }) {
  // `null` means the backend did not answer. The switch is disabled in that
  // case instead of guessing at a state — a toggle that shows "off" when it
  // does not know is how an admin ends up flipping it the wrong way.
  const [enabled, setEnabled] = useState(initialEnabled ?? false);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const unavailable = initialEnabled === null;

  function toggle() {
    const next = !enabled;

    if (next && !window.confirm("Включить режим разработки? Сайт станет недоступен посетителям.")) {
      return;
    }

    startTransition(async () => {
      setEnabled(next);
      const result = await updateMaintenanceModeAction(next);
      if (!result.success) {
        setEnabled(!next);
        showToast(result.error);
        return;
      }
      showToast(next ? "Режим разработки включён" : "Сайт снова доступен", "success");
    });
  }

  return (
    <section className="border-t border-brand-black/10 pt-8">
      <div>
        <h2 className="text-lg font-semibold text-brand-black">Сайт в разработке</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Заглушка вместо сайта на всех языках. Админ-панель продолжает работать.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 rounded-card border border-brand-black/10 p-4">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Сайт в разработке"
          onClick={toggle}
          disabled={isPending || unavailable}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50",
            enabled ? "bg-brand-red" : "bg-brand-black/20",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 size-5 rounded-full bg-brand-white shadow transition-transform",
              enabled && "translate-x-5",
            )}
          />
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-medium text-brand-black">
            {unavailable
              ? "Состояние неизвестно"
              : enabled
                ? "Включён — посетители видят заглушку"
                : "Выключен — сайт работает обычно"}
          </p>
          <p className="mt-0.5 text-sm text-neutral-500">
            {unavailable
              ? "Не удалось связаться с сервером. Обновите страницу и попробуйте снова."
              : "Переключатель сохраняется сразу."}
          </p>
        </div>
      </div>

      {enabled && !unavailable ? (
        <p className="mt-3 flex items-start gap-2 text-sm text-brand-red">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          Сейчас все страницы сайта закрыты заглушкой «Сайт в разработке».
        </p>
      ) : null}
    </section>
  );
}
