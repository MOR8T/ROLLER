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
    <div className="relative flex min-h-svh w-full items-end sm:items-center">
      <div className="absolute inset-0">
        <Image
          src={slide.image}
          alt={slide.headline}
          fill
          priority={isFirst}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(29,29,27,0.92)_0%,rgba(29,29,27,0.72)_42%,rgba(29,29,27,0.35)_70%,rgba(29,29,27,0.2)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(211,0,26,0.28),transparent_45%)]" />
      </div>

      <Container className="relative z-10 w-full pt-28 pb-28 sm:pt-36 sm:pb-32 lg:pt-40 lg:pb-36">
        <div className="max-w-3xl">
          <p className="font-heading text-4xl font-bold tracking-tight text-brand-white sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="text-brand-red">ROL</span>LER
          </p>

          <p className="mt-3 text-xs font-semibold tracking-[0.22em] text-brand-white/55 uppercase sm:mt-4 sm:text-sm">
            {slide.eyebrow}
          </p>

          <h1 className="mt-3 max-w-2xl font-heading text-2xl font-bold tracking-tight text-balance text-brand-white sm:mt-4 sm:text-4xl md:text-5xl lg:text-6xl">
            {slide.headline}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-6 text-brand-white/78 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
            {slide.subtext}
          </p>

          <div className="mt-7 flex flex-col gap-2 sm:mt-8 sm:flex-row sm:gap-3">
            <ButtonLink href={slide.primaryCta.href} size="lg" className="rounded-full">
              {slide.primaryCta.label}
              <ArrowRight className="size-5" />
            </ButtonLink>
            {slide.secondaryCta ? (
              <ButtonLink
                href={slide.secondaryCta.href}
                variant="outline"
                size="lg"
                className="rounded-full border-brand-white/25 bg-brand-white/6 text-brand-white hover:bg-brand-white/12"
              >
                {slide.secondaryCta.label}
              </ButtonLink>
            ) : (
              <ButtonLink
                href={siteConfig.phoneHref}
                variant="outline"
                size="lg"
                className="rounded-full border-brand-white/25 bg-brand-white/6 text-brand-white hover:bg-brand-white/12"
              >
                Заказать звонок
              </ButtonLink>
            )}
          </div>
        </div>
      </Container>
    </div>
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
              "hero-swiper-prev grid size-11 place-items-center rounded-full border border-brand-white/20 bg-brand-black/40 text-brand-white backdrop-blur-sm transition-colors",
              "hover:bg-brand-white/12 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none",
            )}
            aria-label="Предыдущий слайд"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            className={cn(
              "hero-swiper-next grid size-11 place-items-center rounded-full border border-brand-white/20 bg-brand-black/40 text-brand-white backdrop-blur-sm transition-colors",
              "hover:bg-brand-white/12 focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none",
            )}
            aria-label="Следующий слайд"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="hero-swiper-pagination pointer-events-auto static! mx-0! w-auto!" />

        <a
          href="#about"
          className="pointer-events-auto hidden items-center gap-2 rounded-md py-2 text-sm font-medium text-brand-white/60 transition-colors hover:text-brand-white focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-brand-black focus-visible:outline-none lg:inline-flex"
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
        className="hero-swiper relative isolate -mt-16.5 overflow-hidden bg-brand-black text-brand-white sm:-mt-16.5 lg:-mt-20.5"
      >
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
          className="relative min-h-svh w-full"
        >
          {slides.map((slide, index) => (
            <SwiperSlide key={slide.id}>
              <HeroSlideContent slide={slide} isFirst={index === 0} />
            </SwiperSlide>
          ))}

          {canLoop ? <HeroControls /> : null}
        </Swiper>
      </section>

      <TrustStrip />
    </>
  );
}
