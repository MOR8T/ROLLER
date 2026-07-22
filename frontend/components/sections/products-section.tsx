"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/section-heading";
import { ProductCard } from "@/components/sections/product-card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { showcaseProducts } from "@/data/home";
import { useState, useEffect } from "react";

export function ProductsSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const slideCount = showcaseProducts.length;
  const visibleStart = activeSlide;
  const visibleEnd = Math.min(visibleStart + 1, slideCount);
  const visibleProducts = showcaseProducts.slice(visibleStart, visibleEnd);

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
          <SectionHeading
            eyebrow="Системы и бренды"
            title="Линейка для частных домов, квартир и коммерческих объектов"
            // description="Показываем не цену, а класс системы, материал и ключевые характеристики, чтобы быстро сравнить решения под ваш объект."
          />
          <div className="flex flex-col items-start gap-3 lg:items-end">
            {/* <p className="max-w-sm text-sm leading-6 text-brand-black/62">
              Все системы считаем под размеры проёма, формат открывания и требования к
              теплоизоляции.
            </p> */}
            <Link
              href="/catalog"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-black px-5 py-3 text-sm font-semibold text-brand-white transition-colors hover:bg-brand-red focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Смотреть каталог
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <Reveal preset="stagger" className="mt-10">
          {isMobile ? (
            <div className="relative">
              <div className="grid gap-5 overflow-hidden sm:gap-6">
                {visibleProducts.map((product) => (
                  <RevealItem key={product.name}>
                    <ProductCard {...product} sizes="100vw" />
                  </RevealItem>
                ))}
              </div>

              {slideCount > 1 && (
                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    onClick={goToPreviousSlide}
                    className="flex size-11 items-center justify-center rounded-full border border-brand-black/15 transition-colors hover:border-brand-red hover:bg-brand-red/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                    aria-label="Previous product"
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
                    {showcaseProducts.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`grid size-9 place-items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none ${
                          idx === activeSlide ? "" : "hover:opacity-70"
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                        aria-current={idx === activeSlide}
                      >
                        <span
                          className={`block size-2 rounded-full transition-colors ${
                            idx === activeSlide ? "bg-brand-red" : "bg-brand-black/20 text-brand-white"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={goToNextSlide}
                    className="flex size-11 items-center justify-center rounded-full border border-brand-black/15 transition-colors hover:border-brand-red hover:bg-brand-red/5 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:outline-none"
                    aria-label="Next product"
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
          ) : (
            <div className="grid gap-5 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
              {showcaseProducts.map((product) => (
                <RevealItem key={product.name}>
                  <ProductCard
                    {...product}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  />
                </RevealItem>
              ))}
            </div>
          )}
        </Reveal>

        {/* <p className="mt-6 text-sm leading-6 text-brand-black/62">
          Цена по расчёту: подбираем систему под размеры, формат открывания и требования конкретного
          объекта.
        </p> */}
      </Container>
    </Section>
  );
}
