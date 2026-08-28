"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Card } from "@/components/ui/card";
import { login, type LoginState } from "./login-actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  // React resets an uncontrolled form once its action resolves, so after a
  // failed attempt the login field would come back empty and have to be
  // retyped. Keeping it controlled preserves it; the password field stays
  // uncontrolled precisely so that it *is* cleared.
  const [username, setUsername] = useState("");

  // Second line of defence behind the Server Action: until React has hydrated
  // this page there is no `isPending`, no error rendering and no double-submit
  // guard, so the submit button stays disabled — which also blocks implicit
  // submission via Enter, since a form with a disabled default button does not
  // submit. The admin panel is JS-only anyway (every manager under
  // `components/admin/` is a client component), so this costs no working
  // no-JS path.
  //
  // `useSyncExternalStore` rather than a `useState`/`useEffect` pair: the
  // server snapshot is `false` and the client snapshot `true`, which is
  // exactly the "has this hydrated yet" signal, without the cascading render
  // an effect-set state would cause (and which `react-hooks` flags).
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <main className="flex flex-1 items-center justify-center px-gutter py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <BrandLogo isDark className="h-10" />
        </div>

        <Card variant="elevated" className="p-8">
          <h1 className="mb-6 text-center text-xl font-semibold text-brand-black">
            Вход в панель управления
          </h1>

          <form action={formAction} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-sm font-medium text-brand-black"
              >
                Логин
              </label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                required
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-brand-black"
              >
                Пароль
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
              />
            </div>

            {state.error && (
              <p role="alert" className="text-sm text-brand-red">
                {state.error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={!isHydrated || isPending}>
              {isPending ? "Входим..." : "Войти"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
