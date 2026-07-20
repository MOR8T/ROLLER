"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * WhatsApp Floating Action Button
 *
 * Fixed bottom-right FAB with WhatsApp icon. Common IMZO/AKFA pattern.
 * Hidden on print. Accessible with aria-label.
 */
export function WhatsAppFab() {
  return (
    <Link
      href={siteConfig.whatsappHref}
      aria-label="Написать нам в WhatsApp"
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "grid size-14 place-items-center rounded-full",
        "bg-brand-red text-brand-white transition-all duration-200",
        "hover:shadow-lg hover:scale-110",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red",
        "print:hidden",
      )}
    >
      <MessageCircle className="size-6" aria-hidden />
    </Link>
  );
}
