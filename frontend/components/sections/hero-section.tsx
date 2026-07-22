"use client";

import { useEffect, useMemo, useState, type FocusEvent } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides, serviceHighlights } from "@/data/home";
import type { HeroSlide } from "@/types";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { MediaFrame } from "@/components/ui/media-frame";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

function TrustStrip() {
  return (
    <div className="bg-brand-white/95 shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.12)]">
      <Container className="py-6 sm:py-8 md:py-10">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8">
          {serviceHighlights.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <div
                key={highlight.label}
                className="flex flex-col items-center gap-2 text-center sm:gap-3"
              >
                <div className="rounded-full bg-brand-red/8 p-3">
                  <Icon className="size-5 text-brand-red sm:size-6" />
                </div>
                <p className="text-xs font-semibold text-brand-black sm:text-sm md:text-base">
                  {highlight.label}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </div>
  );
}

const SLIDE_INTERVAL_MS = 6500;

const fallbackSlides: HeroSlide[] = [
  {
    id: "fallback-hero",
    eyebrow: "Профильные системы ROLLER",
    headline: "Производим окна, двери и фасадные решения",
    subtext:
      "Работаем с ПВХ и алюминием для частных домов, бизнеса и современных городских объектов по всему Таджикистану.",
    image: "/hero/hero-main.png",
    primaryCta: { label: "Рассчитать стоимость", href: "/calculator" },
    secondaryCta: { label: "Заказать звонок", href: "/contacts" },
  },
];

export function HeroSection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const slides = useMemo(() => (heroSlides.length > 0 ? heroSlides : fallbackSlides), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [erroredSlideIds, setErroredSlideIds] = useState<ReadonlySet<string>>(() => new Set());

  const slideCount = slides.length;
  const activeSlide = slides[activeIndex] ?? slides[0];
  const canAutoAdvance = slideCount > 1 && !paused && !prefersReducedMotion;

  const markSlideErrored = (slideId: string) => {
    setErroredSlideIds((prev) => {
      if (prev.has(slideId)) return prev;
      const next = new Set(prev);
      next.add(slideId);
      return next;
    });
  };

  useEffect(() => {
    if (!canAutoAdvance) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((currentIndex) => (currentIndex + 1) % slideCount);
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [canAutoAdvance, slideCount]);

  const goToSlide = (index: number) => {
    setActiveIndex(index);
  };

  const goToPreviousSlide = () => {
    setActiveIndex((currentIndex) => (currentIndex - 1 + slideCount) % slideCount);
  };

  const goToNextSlide = () => {
    setActiveIndex((currentIndex) => (currentIndex + 1) % slideCount);
  };

  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setPaused(false);
  };

  return (
    <>
      <section
        className="relative isolate -mt-16.5 overflow-hidden bg-brand-black text-brand-white sm:-mt-16.5 lg:-mt-20.5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={handleBlur}
      >
        <div className="absolute inset-0 -z-30 bg-brand-black" />
        <div className="absolute inset-0 -z-20">
          {slides.map((slide, index) => {
            const hasImage = Boolean(slide.image) && !erroredSlideIds.has(slide.id);
            return (
              <div
                key={slide.id}
                className={cn(
                  "absolute inset-0 transition-[opacity,transform] ease-out",
                  prefersReducedMotion ? "duration-0" : "duration-700",
                  index === activeIndex
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-[1.03] opacity-0",
                )}
                aria-hidden={index !== activeIndex}
              >
                {hasImage ? (
                  <Image
                    src={slide.image}
                    alt={slide.headline}
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover object-center"
                    onError={() => markSlideErrored(slide.id)}
                  />
                ) : (
                  <MediaFrame
                    alt={slide.headline}
                    fill
                    priority={index === 0}
                    containerClassName="bg-brand-black"
                    className="object-cover object-center"
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(29,29,27,0.28)_0%,rgba(29,29,27,0.68)_42%,rgba(29,29,27,0.9)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(211,0,26,0.24),transparent_32%),linear-gradient(120deg,rgba(29,29,27,0.08),rgba(29,29,27,0.54))]" />

        <Container className="grid min-h-svh items-end gap-6 py-16 pt-20 sm:gap-10 sm:pt-32 sm:pb-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:gap-12 lg:pt-40 lg:pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-white/15 bg-brand-white/8 px-3 py-1.5 text-xs text-brand-white/80 backdrop-blur-md sm:px-4 sm:py-2 sm:text-sm">
              <CheckCircle2 className="size-3 text-brand-red sm:size-4" />
              Собственное производство профилей ПВХ и алюминия
            </div>

            <h1 className="mt-4 max-w-4xl text-3xl font-bold tracking-tight text-balance sm:mt-6 sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
              {siteConfig.slogan.ru}
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-white/78 sm:mt-6 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
              Производим окна, двери и фасадные решения с точной геометрией, контролем качества и
              монтажом под ключ для жилых, коммерческих и городских объектов.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
              <ButtonLink href="/calculator" size="lg" className="rounded-full">
                Рассчитать стоимость
                <ArrowRight className="size-5" />
              </ButtonLink>
              <ButtonLink
                href={siteConfig.phoneHref}
                variant="outline"
                size="lg"
                className="rounded-full border-brand-white/25 bg-brand-white/6 text-brand-white hover:bg-brand-white/12"
              >
                Заказать звонок
              </ButtonLink>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:gap-4 lg:items-end">
            <div className="w-full max-w-xl rounded-3xl border border-brand-white/15 bg-brand-black/40 p-4 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.75)] backdrop-blur-md sm:rounded-4xl sm:p-5 lg:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-heading text-xs font-semibold tracking-[0.24em] text-brand-red uppercase sm:text-sm">
                    {activeSlide.eyebrow}
                  </p>
                  <p className="mt-3 max-w-md text-xl leading-tight font-semibold text-brand-white sm:mt-4 sm:text-2xl lg:text-3xl">
                    {activeSlide.headline}
                  </p>
                </div>
                <div className="rounded-full border border-brand-white/12 bg-brand-white/8 px-3 py-1.5 text-sm font-medium text-brand-white/75">
                  {String(activeIndex + 1).padStart(2, "0")}/{String(slideCount).padStart(2, "0")}
                </div>
              </div>

              <p className="mt-4 max-w-lg text-xs leading-6 text-brand-white/72 sm:mt-5 sm:text-sm lg:text-base">
                {activeSlide.subtext}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2 sm:mt-6">
                <ButtonLink
                  href={activeSlide.primaryCta.href}
                  variant="ghost"
                  className="rounded-full border border-brand-white/12 bg-brand-white/8 text-brand-white hover:bg-brand-white/14"
                >
                  {activeSlide.primaryCta.label}
                  <ArrowRight className="size-4" />
                </ButtonLink>
                {activeSlide.secondaryCta ? (
                  <ButtonLink
                    href={activeSlide.secondaryCta.href}
                    variant="ghost"
                    className="rounded-full text-brand-white/80 hover:bg-brand-white/10 hover:text-brand-white"
                  >
                    {activeSlide.secondaryCta.label}
                  </ButtonLink>
                ) : null}
              </div>

              {slideCount > 1 ? (
                <div className="mt-7 flex flex-col gap-3 border-t border-brand-white/10 pt-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goToPreviousSlide}
                      className="grid size-11 place-items-center rounded-full border border-brand-white/15 bg-brand-white/8 text-brand-white transition-colors hover:bg-brand-white/14 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                      aria-label="Предыдущий слайд"
                    >
                      <ChevronLeft className="size-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextSlide}
                      className="grid size-11 place-items-center rounded-full border border-brand-white/15 bg-brand-white/8 text-brand-white transition-colors hover:bg-brand-white/14 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                      aria-label="Следующий слайд"
                    >
                      <ChevronRight className="size-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {slides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className="grid size-9 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
                        aria-label={`Перейти к слайду ${index + 1}`}
                        aria-pressed={index === activeIndex}
                      >
                        <span
                          className={cn(
                            "block h-1.5 rounded-full transition-all sm:h-2.5",
                            index === activeIndex
                              ? "w-6 bg-brand-red sm:w-10"
                              : "w-1.5 bg-brand-white/35 hover:bg-brand-white/60 sm:w-2.5",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 text-xs text-brand-white/65 sm:text-sm">
              <span className="inline-flex h-px w-6 bg-brand-white/30 sm:w-10" />
              {prefersReducedMotion
                ? "Анимация уменьшена в настройках устройства"
                : "Слайды переключаются автоматически"}
            </div>
          </div>
        </Container>

        <Container className="hidden pb-8 lg:block">
          <a
            href="#about"
            className="inline-flex items-center gap-2 rounded-md py-2 text-sm font-medium text-brand-white/60 transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none"
          >
            Листайте ниже
            <ArrowDown className="size-4" />
          </a>
        </Container>
      </section>

      <TrustStrip />
    </>
  );
}
