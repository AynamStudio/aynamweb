"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion, isCoarsePointer } from "@/lib/motion/prefs";
import { HERO } from "@/lib/constants";
import Magnetic from "@/components/motion/Magnetic";
import TransitionLink from "@/components/motion/TransitionLink";

/**
 * Full-bleed cinematic hero.
 * The image is the environment: 100vw × 100svh behind the content, layered
 * readability gradients, imperceptible mouse depth, scrubbed scroll drift.
 */
export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const mouseRef = useRef<HTMLDivElement>(null); // cursor depth (±6px)
  const fadeRef = useRef<HTMLDivElement>(null); // intro opacity
  const introRef = useRef<HTMLDivElement>(null); // intro scale 1.06 → 1
  const scrollRef = useRef<HTMLDivElement>(null); // scroll scale / drift
  const contentRef = useRef<HTMLDivElement>(null); // content exits faster
  const fillRef = useRef<HTMLSpanElement>(null); // scroll indicator progress
  const indicatorRef = useRef<HTMLDivElement>(null);

  /* Initial (pre-paint) state so nothing flashes and reduced-motion stays visible */
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap: g } = ensureGsap();
    const root = rootRef.current;
    if (!root) return;
    g.set(fadeRef.current, { autoAlpha: 0 });
    g.set(introRef.current, { scale: 1.06 });
    g.set(root.querySelectorAll("[data-hero]"), { autoAlpha: 0, y: 16 });
    g.set(root.querySelectorAll("[data-hero='micro']"), { autoAlpha: 0, y: 0 });
    g.set(root.querySelectorAll("[data-hero-line] > span"), { yPercent: 112 });
    g.set(fillRef.current, { scaleY: 0 });
  }, []);

  useEffect(() => {
    const { gsap: g } = ensureGsap();
    const root = rootRef.current;
    if (!root) return;

    if (prefersReducedMotion()) {
      g.set(fadeRef.current, { autoAlpha: 1 });
      g.set(introRef.current, { scale: 1 });
      g.set(root.querySelectorAll("[data-hero]"), { autoAlpha: 1, y: 0 });
      g.set(root.querySelectorAll("[data-hero='micro']"), { autoAlpha: 1 });
      g.set(root.querySelectorAll("[data-hero-line] > span"), { yPercent: 0 });
      g.set(fillRef.current, { scaleY: 0.3 });
      return;
    }

    const header = document.querySelector("header");
    const ctx = gsap.context(() => {
      /* ---- intro timeline: black → image → type → meta ---- */
      const tl = g.timeline({ defaults: { ease: "expo.out" } });
      tl.to(fadeRef.current, { autoAlpha: 1, duration: 1.5, ease: "power2.out" }, 0.1)
        .to(introRef.current, { scale: 1, duration: 2.1, ease: "expo.out" }, 0.1)
        .fromTo(header, { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.3)
        .fromTo(
          root.querySelectorAll("[data-hero='eyebrow']"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.6 },
          0.55
        )
        .fromTo(
          root.querySelectorAll("[data-hero-line] > span"),
          { yPercent: 112 },
          { yPercent: 0, duration: 1.05, stagger: 0.09 },
          0.68
        )
        .fromTo(
          root.querySelectorAll("[data-hero='body']"),
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.7 },
          1.05
        )
        .fromTo(
          root.querySelectorAll("[data-hero='cta']"),
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.08 },
          1.2
        )
        .fromTo(
          root.querySelectorAll("[data-hero='micro']"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 1 },
          1.4
        )
        .fromTo(
          indicatorRef.current,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, duration: 0.8 },
          1.6
        );

      /* ---- scroll: image drifts + scales, content leaves faster ---- */
      g.to(scrollRef.current, {
        scale: 1.045,
        yPercent: -3.5,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.7 },
      });
      g.to(contentRef.current, {
        y: -72,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.5 },
      });

      /* ---- scroll indicator: progress fill + natural exit ---- */
      g.to(fillRef.current, {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.4 },
      });
      g.to(indicatorRef.current, {
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom 55%", scrub: 0.4 },
      });
    }, root);

    /* ---- imperceptible cursor depth (desktop, fine pointer) ---- */
    let xTo: { (v: number): void } | null = null;
    let yTo: { (v: number): void } | null = null;
    const onMove = (e: MouseEvent) => {
      if (!xTo || !yTo) return;
      xTo((e.clientX / window.innerWidth - 0.5) * -8);
      yTo((e.clientY / window.innerHeight - 0.5) * -6);
    };
    if (!isCoarsePointer()) {
      const el = mouseRef.current;
      if (el) {
        xTo = g.quickTo(el, "x", { duration: 1.1, ease: "power2.out" });
        yTo = g.quickTo(el, "y", { duration: 1.1, ease: "power2.out" });
        window.addEventListener("mousemove", onMove, { passive: true });
      }
    }

    return () => {
      ctx.revert();
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      data-surface="dark"
      className="s-dark relative min-h-[100svh] w-full overflow-hidden bg-ink-950"
    >
      {/* ---------- the environment ---------- */}
      <div ref={mouseRef} aria-hidden="true" className="absolute -inset-4 will-change-transform">
        <div ref={fadeRef} className="absolute inset-0">
          <div ref={introRef} className="absolute inset-0 will-change-transform">
            <div ref={scrollRef} className="absolute inset-0 will-change-transform">
              <Image
                src="/images/hero-cinematic.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                objectPosition="68% 46%"
                className="mono-img-hero hidden object-cover md:block"
              />
              <Image
                src="/images/hero-cinematic-mobile.jpg"
                alt=""
                fill
                priority
                sizes="100vw"
                objectPosition="62% 40%"
                className="mono-img-hero object-cover md:hidden"
              />
            </div>
          </div>
        </div>

        {/* layered readability system */}
        <div className="hero-scrim-base absolute inset-0" />
        <div className="hero-scrim-linear absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-ink-950/85 to-transparent" />
        {/* cinematic vignette */}
        <div className="hero-vignette absolute inset-0" />
      </div>

      {/* ---------- editorial micro-copy over negative space ---------- */}
      <p
        data-hero="micro"
        className="label-tech absolute right-6 top-[18%] z-10 hidden text-right leading-[2.3] text-fog-dim sm:block md:right-10 lg:right-14"
      >
        {HERO.visualNote.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </p>

      {/* ---------- content ---------- */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto grid min-h-[100svh] w-full max-w-shell grid-rows-[1fr_auto] px-5 pb-7 pt-[72px] will-change-transform md:px-8 md:pb-9 md:pt-[84px] lg:px-12"
      >
        <div className="max-w-[720px] self-center py-8">
          <span data-hero="eyebrow" className="label-tech text-fog-dim">
            {HERO.eyebrow}
          </span>

          <h1 className="headline mt-6 max-w-[700px] text-[clamp(2.5rem,11vw,3.4rem)] text-fog md:text-[clamp(4.5rem,5.9vw,5.25rem)]">
            {HERO.lines.map((line, i) => (
              <span className="mask-line" data-hero-line key={line}>
                <span className={i === 3 ? "text-fg" : undefined}>{line}</span>
              </span>
            ))}
          </h1>

          <p
            data-hero="body"
            className="mt-7 max-w-[540px] text-sm leading-relaxed text-fog-dim md:text-base lg:text-lg"
          >
            {HERO.body}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3 md:gap-4">
            <Magnetic data-hero="cta">
              <TransitionLink
                href={HERO.primaryCta.href}
                className="group inline-flex items-center gap-2 rounded-md bg-fg px-7 py-3 text-sm font-medium text-ink-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-fg/90"
              >
                {HERO.primaryCta.label}
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </TransitionLink>
            </Magnetic>
            <Magnetic data-hero="cta" strength={0.16}>
              <TransitionLink
                href={HERO.secondaryCta.href}
                className="group inline-flex items-center gap-2 rounded-md border border-fg/25 px-6 py-3 text-sm text-fog transition-all duration-300 hover:border-fg/50 hover:bg-fg/5"
              >
                {HERO.secondaryCta.label}
                <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </TransitionLink>
            </Magnetic>
          </div>
        </div>

        {/* bottom row: scroll indicator */}
        <div className="flex items-end justify-end">
          <div ref={indicatorRef} data-hero="scroll" className="flex flex-col items-center gap-3 pb-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-fg/30">
              <span className="h-1 w-1 rounded-full bg-fg" />
            </span>
            <span className="relative block h-14 w-px overflow-hidden bg-fg/15">
              <span ref={fillRef} className="absolute inset-0 origin-top bg-fg" />
            </span>
            <span className="label-tech text-[9px] text-fog-muted [writing-mode:vertical-lr]">
              SCROLL
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
