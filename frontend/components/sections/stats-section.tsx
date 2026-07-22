"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/container";
import { Reveal, RevealItem } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/sections/section-heading";
import { companyStats, type CompanyStat } from "@/data/home";

const COUNT_DURATION = 1.4;
const COUNT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function formatStatValue(value: number): string {
  return value.toLocaleString("ru-RU").replace(/\u00A0/g, " ");
}

function CountUpStat({ stat }: { stat: CompanyStat }) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    if (!inView || prefersReducedMotion) return;

    const controls = animate(0, stat.value, {
      duration: COUNT_DURATION,
      ease: COUNT_EASE,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, prefersReducedMotion, stat.value]);

  const value = prefersReducedMotion ? stat.value : display;

  return (
    <span ref={ref} className="tabular-nums">
      {formatStatValue(value)}
      {stat.suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <Section id="stats" className="bg-brand-white text-brand-black">
      <Container>
        <Reveal preset="fade-up" className="max-w-3xl">
          <SectionHeading
            eyebrow="Цифры"
            title="Масштаб, которому можно доверять"
            // description="Производство, команда и география проектов — в одном кадре. Цифры обновляются по мере роста компании."
            tone="light"
          />
        </Reveal>

        <Reveal
          preset="stagger"
          className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5 lg:gap-5"
        >
          {companyStats.map((stat, index) => (
            <RevealItem
              key={stat.label}
              className="group relative flex h-full flex-col rounded-3xl border border-brand-black/10 bg-brand-black/[0.04] p-6 transition-colors duration-300 hover:border-brand-red/40 hover:bg-brand-black/[0.07]"
            >
              <span className="font-heading text-sm font-semibold text-brand-black/30 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="mt-4 font-heading text-4xl font-bold tracking-tight text-brand-red sm:text-5xl">
                <CountUpStat stat={stat} />
              </p>
              <p className="mt-3 text-sm font-medium text-brand-black/65">{stat.label}</p>
              <span className="mt-5 h-px w-10 bg-brand-red/40 transition-all duration-300 group-hover:w-16 group-hover:bg-brand-red" />
            </RevealItem>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
