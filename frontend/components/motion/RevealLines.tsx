"use client";

import { createElement, useEffect, useRef, type ElementType, type ReactNode } from "react";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/prefs";
import { cn } from "@/lib/utils";

type Props = {
  lines: readonly string[];
  as?: ElementType;
  className?: string;
  lineClassName?: string;
  trigger?: "load" | "scroll";
  delay?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  id?: string;
  children?: ReactNode;
};

/** Line-based masked reveal: each line rises out of an overflow-hidden mask. */
export default function RevealLines({
  lines,
  as: Tag = "h2",
  className,
  lineClassName,
  trigger = "scroll",
  delay = 0,
  duration = 1,
  stagger = 0.09,
  start = "top 84%",
  id,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap: g } = ensureGsap();
    const targets = ref.current?.querySelectorAll(".mask-line > span");
    if (!targets || !targets.length) return;
    const ctx = gsap.context(() => {
      g.fromTo(
        targets,
        { yPercent: 112 },
        {
          yPercent: 0,
          duration,
          delay,
          stagger,
          ease: "expo.out",
          scrollTrigger:
            trigger === "scroll" ? { trigger: ref.current, start, once: true } : undefined,
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay, duration, stagger, start, trigger]);

  return (
    createElement(
      Tag,
      { ref: ref as never, id, className },
      lines.map((line, i) => (
        <span className={cn("mask-line", lineClassName)} key={`${line}-${i}`}>
          <span>{line}</span>
        </span>
      ))
    )
  );
}
