"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion, isCoarsePointer } from "@/lib/motion/prefs";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  strength?: number;
  start?: string;
  end?: string;
};

/** Subtle vertical parallax for imagery inside an overflow-hidden frame. */
export default function Parallax({ children, className, strength = 7, start = "top bottom", end = "bottom top" }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const { gsap: g } = ensureGsap();
    const ctx = gsap.context(() => {
      g.fromTo(
        innerRef.current,
        { yPercent: -strength },
        {
          yPercent: strength,
          ease: "none",
          scrollTrigger: { trigger: wrapRef.current, start, end, scrub: 0.6 },
        }
      );
    }, wrapRef);
    return () => ctx.revert();
  }, [strength, start, end]);

  return (
    <div ref={wrapRef} className={cn("relative overflow-hidden", className)}>
      <div ref={innerRef} className="absolute -inset-y-[10%] inset-x-0 will-change-transform">
        {children}
      </div>
    </div>
  );
}
