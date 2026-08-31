import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Вход — ROLLER",
  robots: { index: false, follow: false },
};

/**
 * Own root layout: `/login` lives outside `app/[locale]`, so it does not go
 * through that segment's layout (and does not need next-intl — the admin
 * area is not part of the localized public site).
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-surface-muted text-foreground">{children}</body>
    </html>
  );
}
