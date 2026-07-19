"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Phone, X } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ButtonLink } from "@/components/ui/button";
import { navLinks, siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-black/10 bg-brand-white/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between lg:h-20">
        <Link href="/" className="font-heading text-2xl font-bold tracking-tight">
          ROLLER<span className="text-brand-red">.TJ</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-black/80 transition-colors hover:text-brand-red"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <a
            href={siteConfig.phoneHref}
            className="flex items-center gap-2 text-sm font-semibold text-brand-black hover:text-brand-red"
          >
            <Phone className="size-4" />
            {siteConfig.phone}
          </a>
          <ButtonLink href={siteConfig.whatsappHref} size="sm">
            WhatsApp
          </ButtonLink>
        </div>

        <button
          type="button"
          aria-label="Меню"
          className="lg:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </Container>

      <div
        className={cn(
          "border-t border-brand-black/10 bg-brand-white lg:hidden",
          open ? "block" : "hidden",
        )}
      >
        <Container className="flex flex-col gap-1 py-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-brand-black/80 hover:bg-brand-black/5"
            >
              {link.label}
            </Link>
          ))}
          <ButtonLink href={siteConfig.whatsappHref} className="mt-2">
            Написать в WhatsApp
          </ButtonLink>
        </Container>
      </div>
    </header>
  );
}
