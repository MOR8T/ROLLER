"use client";

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type TargetAndTransition,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type RevealPreset = "fade-up" | "fade" | "stagger";

const DEFAULT_DURATION = 0.5;
const DEFAULT_EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
const DEFAULT_STAGGER = 0.12;
const DEFAULT_AMOUNT = 0.2;
const DEFAULT_Y_OFFSET = 24;

export const revealPresets: Record<RevealPreset, Variants> = {
  "fade-up": {
    hidden: { opacity: 0, y: DEFAULT_Y_OFFSET },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DEFAULT_DURATION, ease: DEFAULT_EASE },
    },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: DEFAULT_DURATION, ease: DEFAULT_EASE },
    },
  },
  stagger: {
    hidden: {},
    visible: { transition: { staggerChildren: DEFAULT_STAGGER } },
  },
};

export const revealItemVariants: Variants = {
  hidden: { opacity: 0, y: DEFAULT_Y_OFFSET },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DEFAULT_DURATION, ease: DEFAULT_EASE },
  },
};

function buildContainerVariants(preset: RevealPreset, delay: number, reduced: boolean): Variants {
  const base = revealPresets[preset];

  if (reduced) {
    if (preset === "stagger") {
      return {
        hidden: {},
        visible: { transition: { staggerChildren: 0, delayChildren: 0 } },
      };
    }
    return {
      hidden: base.hidden,
      visible: {
        ...(base.visible as TargetAndTransition),
        transition: { duration: 0, delay: 0 },
      },
    };
  }

  if (preset === "stagger") {
    return {
      hidden: base.hidden,
      visible: { transition: { staggerChildren: DEFAULT_STAGGER, delayChildren: delay } },
    };
  }

  const baseVisible = base.visible as TargetAndTransition;
  const visible: TargetAndTransition = {
    ...baseVisible,
    transition: { ...(baseVisible.transition ?? {}), delay },
  };
  return { hidden: base.hidden, visible };
}

export interface RevealProps extends Omit<
  HTMLMotionProps<"div">,
  "variants" | "initial" | "whileInView" | "viewport" | "transition"
> {
  preset?: RevealPreset;
  delay?: number;
  once?: boolean;
  amount?: number;
}

export function Reveal({
  preset = "fade-up",
  delay = 0,
  once = true,
  amount = DEFAULT_AMOUNT,
  className,
  children,
  ...props
}: RevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const variants = buildContainerVariants(preset, delay, Boolean(prefersReducedMotion));

  return (
    <motion.div
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export interface RevealItemProps extends Omit<
  HTMLMotionProps<"div">,
  "variants" | "initial" | "whileInView" | "viewport" | "transition"
> {
  children: ReactNode;
}

export function RevealItem({ className, children, ...props }: RevealItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const variants: Variants = prefersReducedMotion
    ? {
        hidden: revealItemVariants.hidden,
        visible: {
          ...(revealItemVariants.visible as TargetAndTransition),
          transition: { duration: 0, delay: 0 },
        },
      }
    : revealItemVariants;

  return (
    <motion.div className={cn(className)} variants={variants} {...props}>
      {children}
    </motion.div>
  );
}
