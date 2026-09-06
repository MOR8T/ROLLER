"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * WhatsApp Floating Action Button
 *
 * Fixed bottom-right FAB with WhatsApp icon. Common IMZO/AKFA pattern.
 * Hidden on print. Accessible with aria-label.
 *
 * Plain `<a>`: the target is another origin, so there is no locale prefix to
 * add and nothing for the router to prefetch.
 */
export function WhatsAppFab() {
  const t = useTranslations("whatsappFab");

  return (
    <a
      href={siteConfig.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("label")}
      className={cn(
        "fixed right-6 bottom-6 z-40",
        "grid size-14 place-items-center rounded-full",
        "bg-brand-red text-brand-white transition-all duration-200",
        "hover:scale-110 hover:shadow-lg active:scale-90 active:shadow-lg",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
        "print:hidden",
      )}
    >
      <MessageCircle className="size-6" aria-hidden />
    </a>
  );
}
