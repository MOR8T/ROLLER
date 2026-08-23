import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Панель управления — ROLLER",
  robots: { index: false, follow: false },
};

/** Own root layout — see the comment in `app/login/layout.tsx`. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="min-h-full bg-surface-muted text-foreground">{children}</body>
    </html>
  );
}
