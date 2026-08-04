"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { A11y, Autoplay, EffectFade, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { heroSlides, serviceHighlights } from "@/data/home";
import type { HeroSlide } from "@/types";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import "swiper/css";
import "swiper/css/a11y";
import "swiper/css/effect-fade";
import "swiper/css/navigation";
import "swiper/css/pagination";

const AUTOPLAY_DELAY_MS = 6000;

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

function TrustStrip() {
  return (
    <div className="bg-brand-white shadow-[0_-12px_40px_-8px_rgba(0,0,0,0.12)]">
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

function HeroSlideContent({ slide, isFirst }: { slide: HeroSlide; isFirst: boolean }) {
  return (
    <Container className="grid min-h-svh w-full content-center gap-6 pt-24 pb-28 sm:gap-8 sm:pt-32 sm:pb-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pt-36 lg:pb-36">
      <div className="max-w-2xl">
        {/* <p className="font-heading text-4xl font-bold tracking-tight text-brand-black sm:text-6xl md:text-7xl lg:text-8xl">
          <span className="text-brand-red">ROL</span>LER
        </p> */}

        <p className="text-xs font-semibold tracking-[0.22em] text-brand-red uppercase sm:text-sm">
          {slide.eyebrow}
        </p>

        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-balance text-brand-black sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
          {slide.headline}
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-6 text-brand-black/70 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
          {slide.subtext}
        </p>

        <div className="mt-7 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
          <ButtonLink
            href={slide.primaryCta.href}
            size="lg"
            className="rounded-full shadow-lg shadow-brand-red/20"
          >
            {slide.primaryCta.label}
            <ArrowRight className="size-5" />
          </ButtonLink>
          {/* {slide.secondaryCta ? (
            <ButtonLink
              href={slide.secondaryCta.href}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              {slide.secondaryCta.label}
            </ButtonLink>
          ) : (
            <ButtonLink
              href={siteConfig.phoneHref}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              Заказать звонок
            </ButtonLink>
          )} */}
        </div>
      </div>

      {/* Product cutout. All slide images are alpha PNGs, so they sit on the
          light canvas directly — no scrim needed. */}
      <div className="relative h-[30svh] w-full sm:h-[36svh] lg:h-[min(68svh,600px)]">
        <Image
          src={slide.image}
          alt={slide.headline}
          fill
          priority={isFirst}
          sizes="(max-width: 1024px) 90vw, 45vw"
          className="object-contain object-center lg:object-right"
        />
      </div>
    </Container>
  );
}

function HeroControls() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-8 z-20 sm:bottom-10 lg:bottom-12">
      <Container className="flex items-center justify-between gap-4">
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "hero-swiper-prev grid size-11 place-items-center rounded-full border border-brand-black/12 bg-brand-white/80 text-brand-black backdrop-blur-sm transition-colors",
              "hover:bg-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white focus-visible:outline-none",
            )}
            aria-label="Предыдущий слайд"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className={cn(
              "hero-swiper-next grid size-11 place-items-center rounded-full border border-brand-black/12 bg-brand-white/80 text-brand-black backdrop-blur-sm transition-colors",
              "hover:bg-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white focus-visible:outline-none",
            )}
            aria-label="Следующий слайд"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="hero-swiper-pagination pointer-events-auto static! mx-0! w-auto!" />

        <a
          href="#about"
          className="pointer-events-auto hidden items-center gap-2 rounded-md py-2 text-sm font-medium text-brand-black/55 transition-colors hover:text-brand-black focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-white focus-visible:outline-none lg:inline-flex"
        >
          Листайте ниже
          <ArrowDown className="size-4" />
        </a>
      </Container>
    </div>
  );
}

export function HeroSection() {
  const prefersReducedMotion = Boolean(useReducedMotion());
  const slides = heroSlides.length > 0 ? heroSlides : fallbackSlides;
  const canLoop = slides.length > 1;

  return (
    <>
      <section
        aria-label="Главный баннер"
        className="hero-swiper relative isolate -mt-16.5 overflow-hidden border-b border-brand-black/8 bg-neutral-50 pb-0.5 text-brand-black sm:-mt-16.5 lg:-mt-20.5"
      >
        {/* Soft light backdrop: subtle vertical lift plus a faint red glow,
            replacing the dark scrim that used to sit on top of the product
            cutouts (all hero slide images are alpha PNGs). */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-50 via-brand-white to-neutral-50" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(211,0,26,0.07),transparent_55%)]" />

        <Swiper
          modules={[A11y, Autoplay, EffectFade, Navigation, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={prefersReducedMotion ? 0 : 900}
          loop={canLoop}
          slidesPerView={1}
          autoplay={
            canLoop && !prefersReducedMotion
              ? {
                  delay: AUTOPLAY_DELAY_MS,
                  disableOnInteraction: false,
                  pauseOnMouseEnter: true,
                }
              : false
          }
          navigation={
            canLoop
              ? {
                  prevEl: ".hero-swiper-prev",
                  nextEl: ".hero-swiper-next",
                }
              : false
          }
          pagination={
            canLoop
              ? {
                  el: ".hero-swiper-pagination",
                  clickable: true,
                }
              : false
          }
          a11y={{
            enabled: true,
            prevSlideMessage: "Предыдущий слайд",
            nextSlideMessage: "Следующий слайд",
            paginationBulletMessage: "Перейти к слайду {{index}}",
          }}
          className="relative z-10 min-h-svh w-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <HeroSlideContent slide={slide} isFirst={index === 0} />
            </SwiperSlide>
          ))}

          {canLoop ? <HeroControls /> : null}
        </Swiper>
      </section>

      {/* <TrustStrip /> */}
    </>
  );
}
