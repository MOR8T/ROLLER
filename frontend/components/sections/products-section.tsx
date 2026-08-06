"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { ProductCard } from "@/components/sections/product-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { RevealGroup, RevealItem } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { showcaseProducts } from "@/data/home";

/**
 * Not on the homepage. The brand lineup replaced it there: it covers all six
 * systems instead of five and explains how they differ, which is the page's
 * stated job (DESIGN.md §1, §7). Kept for the catalog, stage 04.
 */
export function ProductsSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const t = useTranslations("products");

  const slideCount = showcaseProducts.length;
  const activeProduct = showcaseProducts[activeSlide];

  const goToPreviousSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slideCount) % slideCount);
  };

  const goToNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slideCount);
  };

  return (
    <Section id="products">
      <Container>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <Link
              href="/catalog"
              className="inline-flex w-fit shrink-0 items-center gap-2 rounded-control bg-brand-black px-5 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {t("viewCatalog")}
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Mobile: one-card slider — no RevealItem (avoids stuck opacity:0 after remount) */}
        <div className="mt-10 md:hidden">
          <div className="relative">
            <ProductCard key={activeProduct.slug} {...activeProduct} sizes="100vw" />

            {slideCount > 1 && (
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={goToPreviousSlide}
                  className="flex size-11 items-center justify-center rounded-full border border-brand-black/15 transition-colors hover:border-brand-red hover:bg-brand-red/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                  aria-label={t("previousSlide")}
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <div className="flex items-center gap-1">
                  {showcaseProducts.map((product, idx) => (
                    <button
                      key={product.slug}
                      type="button"
                      onClick={() => setActiveSlide(idx)}
                      className={`grid size-9 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none ${
                        idx === activeSlide ? "" : "hover:opacity-70"
                      }`}
                      aria-label={t("goToSlide", { index: idx + 1 })}
                      aria-current={idx === activeSlide ? "true" : undefined}
                    >
                      <span
                        className={`block size-2 rounded-full transition-colors ${
                          idx === activeSlide
                            ? "bg-brand-red"
                            : "bg-brand-black/20 text-brand-white"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={goToNextSlide}
                  className="flex size-11 items-center justify-center rounded-full border border-brand-black/15 transition-colors hover:border-brand-red hover:bg-brand-red/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                  aria-label={t("nextSlide")}
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop / tablet: grid with stagger reveal */}
        <RevealGroup className="mt-10 hidden gap-5 sm:gap-6 md:grid md:grid-cols-2 xl:grid-cols-3">
          {showcaseProducts.map((product) => (
            <RevealItem key={product.slug}>
              <ProductCard
                {...product}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              />
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
