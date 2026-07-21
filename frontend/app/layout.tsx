import type { Metadata } from "next";
import { Chakra_Petch, Montserrat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ROLLER — Профильные системы ПВХ и алюминий в Таджикистане",
    template: "%s | ROLLER",
  },
  description:
    "ROLLER — первый производитель материалов из ПВХ в Таджикистане. Окна и двери ПВХ, алюминиевые и фасадные системы. Тепло и комфорт для каждого дома.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${montserrat.variable} ${chakraPetch.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-md focus:bg-brand-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-white focus:shadow-lg"
        >
          Перейти к основному содержимому
        </a>
        <Header />
        <main id="top" className="flex-1">
          {children}
        </main>
        <Footer />
        <WhatsAppFab />
      </body>
    </html>
  );
}
