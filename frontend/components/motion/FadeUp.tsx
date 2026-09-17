"use client";

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from "react";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/prefs";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  trigger?: "load" | "scroll";
  delay?: number;
  duration?: number;
  y?: number;
  start?: string;
};

/** Quiet opacity + rise reveal. The workhorse for paragraphs, labels, chips. */
export default function FadeUp({
  children,
  className,
  as: Tag = "div",
  trigger = "scroll",
  delay = 0,
  duration = 0.8,
  y = 22,
  start = "top 88%",
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap: g } = ensureGsap();
    const ctx = gsap.context(() => {
      g.fromTo(
        ref.current,
        { autoAlpha: 0, y },
        {
          autoAlpha: 1,
          y: 0,
          duration,
          delay,
          ease: "expo.out",
          scrollTrigger:
            trigger === "scroll" ? { trigger: ref.current, start, once: true } : undefined,
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay, duration, y, start, trigger]);

  return (
    createElement(Tag, { ref: ref as never, className: cn(className) }, children)
  );
}
