"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/prefs";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  /** clip-path wipe direction */
  from?: "right" | "left" | "bottom";
  delay?: number;
  duration?: number;
  start?: string;
  rounded?: string;
};

/** Editorial image entrance: mask wipes open while the image settles from 1.08 → 1. */
export default function ImageReveal({
  children,
  className,
  from = "right",
  delay = 0,
  duration = 1.15,
  start = "top 82%",
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap: g } = ensureGsap();
    const hidden =
      from === "right" ? "inset(0 100% 0 0)" : from === "left" ? "inset(0 0 0 100%)" : "inset(100% 0 0 0)";
    const ctx = gsap.context(() => {
      const tl = g.timeline({
        scrollTrigger: { trigger: wrapRef.current, start, once: true },
      });
      tl.fromTo(
        wrapRef.current,
        { clipPath: hidden },
        { clipPath: "inset(0 0% 0 0)", duration, delay, ease: "expo.inOut" }
      ).fromTo(innerRef.current, { scale: 1.08 }, { scale: 1, duration: duration + 0.35, ease: "expo.out" }, delay);
    }, wrapRef);
    return () => ctx.revert();
  }, [from, delay, duration, start]);

  return (
    <div ref={wrapRef} className={cn("relative overflow-hidden", className)}>
      <div ref={innerRef} className="absolute inset-0 will-change-transform">
        {children}
      </div>
    </div>
  );
}
