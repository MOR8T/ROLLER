import type { Metadata } from "next";
import { Chakra_Petch, Montserrat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppFab } from "@/components/layout/whatsapp-fab";

// `subsets` here controls PRELOADING only — next/font emits @font-face blocks
// for every subset the font ships, so glyphs outside this list still render;
// the browser just fetches them on demand via unicode-range.
//
// So this list is a bandwidth trade-off, not a correctness one. It names the
// subsets the default locale needs. The Tajik letters ғ қ ҳ ҷ ӣ ӯ (cyrillic-ext)
// and the Turkish ğ ş İ (latin-ext) load lazily on those locales rather than
// being pushed at every Russian visitor. Adding all four subsets here doubles
// the preloaded font files from 6 to 12 on every page.
//
// Proper fix is per-locale preloading once `[locale]` routing lands — see
// .cursor/project_plan/03-i18n-foundation.md.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Chakra Petch ships no Cyrillic subset at all — only latin, latin-ext, thai
// and vietnamese. Cyrillic headings therefore render in Montserrat through the
// `--font-heading` fallback chain, by design rather than by accident. This font
// is effectively reserved for brand names (ROLLER, STELLA, UNOPEN) and numerals.
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
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-control focus:bg-brand-black focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-white focus:shadow-lg"
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
