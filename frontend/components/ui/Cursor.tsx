"use client";

import { useEffect, useRef } from "react";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion, isCoarsePointer } from "@/lib/motion/prefs";

/**
 * Desktop-only quiet cursor.
 * - 5px dot (default)
 * - hairline ring (interactive elements)
 * - white disc with dark label for [data-cursor] targets — the label is never
 *   scaled (the disc pops 0.5 → 1 and rests at natural size).
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || isCoarsePointer()) return;
    const { gsap: g } = ensureGsap();
    const dot = dotRef.current;
    const ring = ringRef.current;
    const disc = discRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !disc || !label) return;

    document.documentElement.classList.add("cursor-on");
    g.set([dot, ring], { autoAlpha: 0 });
    g.set(disc, { autoAlpha: 0, scale: 0.5 });

    const xDot = g.quickTo(dot, "x", { duration: 0.16, ease: "power2.out" });
    const yDot = g.quickTo(dot, "y", { duration: 0.16, ease: "power2.out" });
    const xRing = g.quickTo(ring, "x", { duration: 0.4, ease: "power3.out" });
    const yRing = g.quickTo(ring, "y", { duration: 0.4, ease: "power3.out" });
    const xDisc = g.quickTo(disc, "x", { duration: 0.34, ease: "power3.out" });
    const yDisc = g.quickTo(disc, "y", { duration: 0.34, ease: "power3.out" });

    const move = (e: MouseEvent) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
      xDisc(e.clientX);
      yDisc(e.clientY);
    };
    const enter = () => g.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
    const leave = () => g.to([dot, ring, disc], { autoAlpha: 0, duration: 0.3 });

    const over = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const labelled = t.closest?.("[data-cursor]") as HTMLElement | null;
      if (labelled) {
        label.textContent = labelled.dataset.cursor || "";
        g.to([dot, ring], { autoAlpha: 0, duration: 0.2 });
        g.to(disc, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" });
        return;
      }
      g.to(disc, { autoAlpha: 0, scale: 0.5, duration: 0.25, ease: "power2.in" });
      if (t.closest?.("a, button, [role='button'], input, textarea, select")) {
        g.to(ring, { autoAlpha: 1, scale: 1.6, duration: 0.35, ease: "power3.out" });
        g.to(dot, { autoAlpha: 1, duration: 0.25 });
        return;
      }
      g.to(ring, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power3.out" });
      g.to(dot, { autoAlpha: 1, duration: 0.25 });
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseover", over, { passive: true });
    document.documentElement.addEventListener("mouseenter", enter);
    document.documentElement.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
      document.documentElement.removeEventListener("mouseenter", enter);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.classList.remove("cursor-on");
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[120] hidden lg:block">
      <div
        ref={ringRef}
        className="fixed left-0 top-0 -ml-4 -mt-4 h-8 w-8 rounded-full border border-fg/40 opacity-0 mix-blend-difference"
      />
      <div
        ref={dotRef}
        className="fixed left-0 top-0 -ml-[2.5px] -mt-[2.5px] h-[5px] w-[5px] rounded-full bg-fg opacity-0 mix-blend-difference"
      />
      <div
        ref={discRef}
        className="fixed left-0 top-0 -ml-[38px] -mt-[38px] flex h-[76px] w-[76px] items-center justify-center rounded-full bg-fg opacity-0 mix-blend-difference"
      >
        <span className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.14em] text-ink-950">
          <span ref={labelRef} />
        </span>
      </div>
    </div>
  );
}
