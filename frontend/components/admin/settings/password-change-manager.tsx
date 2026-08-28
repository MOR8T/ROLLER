"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Modal } from "@/components/ui/modal";
import { changePasswordAction } from "@/components/admin-sections/settings-actions";

const SAVED_MESSAGE_MS = 4000;

/**
 * Section header + a button that opens the form in a modal, rather than an
 * always-open form on the page — one fewer thing to scroll past for a
 * change an admin makes rarely. The modal closes itself on a successful
 * save; a brief confirmation stays behind on the page since the message
 * would otherwise disappear along with the form.
 */
export function PasswordChangeManager() {
  const [open, setOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const timeout = setTimeout(() => setJustSaved(false), SAVED_MESSAGE_MS);
    return () => clearTimeout(timeout);
  }, [justSaved]);

  return (
    <section className="border-t border-brand-black/10 pt-8">
      <div>
        <h2 className="text-lg font-semibold text-brand-black">Смена пароля</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Пароль для входа в админ-панель. Не короче 8 символов.
        </p>
      </div>

      <Button type="button" className="mt-5" onClick={() => setOpen(true)}>
        Изменить пароль
      </Button>
      {justSaved ? <p className="mt-3 text-sm text-emerald-600">Пароль изменён</p> : null}

      <Modal open={open} onClose={() => setOpen(false)} title="Смена пароля">
        <PasswordChangeForm
          className="mt-5"
          onSuccess={() => {
            setOpen(false);
            setJustSaved(true);
          }}
        />
      </Modal>
    </section>
  );
}

/**
 * Current password + new password (twice, client-side check only). Backend
 * re-validates the current password and the 8-char minimum before writing,
 * so this form's own checks are just fail-fast UX.
 */
function PasswordChangeForm({
  className,
  onSuccess,
}: {
  className?: string;
  onSuccess: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError(null);
    startTransition(async () => {
      const result = await changePasswordAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      onSuccess();
    });
  }

  return (
    <div className={className}>
      {error ? (
        <p role="alert" className="mb-4 text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      <form ref={formRef} onSubmit={submit} className="space-y-4">
        <Field
          name="current_password"
          label="Текущий пароль"
          autoComplete="current-password"
          disabled={isPending}
        />
        <Field
          name="new_password"
          label="Новый пароль"
          autoComplete="new-password"
          disabled={isPending}
        />
        <Field
          name="new_password_confirm"
          label="Повторите новый пароль"
          autoComplete="new-password"
          disabled={isPending}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  autoComplete,
  disabled,
}: {
  name: string;
  label: string;
  autoComplete: string;
  disabled: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-brand-black">
        {label}
      </label>
      <PasswordInput id={name} name={name} required autoComplete={autoComplete} disabled={disabled} />
    </div>
  );
}
