"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Не удалось войти");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Сервер недоступен. Попробуйте ещё раз.");
    } finally {
      setIsSubmitting(false);
    }
  }

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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-brand-black"
              >
                Пароль
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-brand-red">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Входим..." : "Войти"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
