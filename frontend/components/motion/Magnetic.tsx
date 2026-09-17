"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion, isCoarsePointer } from "@/lib/motion/prefs";

/** Gentle magnetic pull toward the pointer (desktop, fine pointers only). */
type Props = React.HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  strength?: number;
  className?: string;
};

export default function Magnetic({ children, strength = 0.22, className, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const { gsap: g } = ensureGsap();
    const el = ref.current;
    if (!el) return;
    const xTo = g.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = g.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const move = (e: globalThis.MouseEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  );
}
