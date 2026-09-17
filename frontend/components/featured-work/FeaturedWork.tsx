"use client";

import { useEffect, useRef } from "react";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/prefs";
import SectionHead from "@/components/motion/SectionHead";
import FadeUp from "@/components/motion/FadeUp";
import TransitionLink from "@/components/motion/TransitionLink";
import CitnBrowserFrame from "@/components/work/CitnBrowserFrame";
import { CITN } from "@/lib/constants";

export default function FeaturedWork() {
  const cardRef = useRef<HTMLDivElement>(null);

  /* Card settles from 0.97 → 1 as it enters */
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const { gsap: g } = ensureGsap();
    const ctx = gsap.context(() => {
      g.fromTo(
        cardRef.current,
        { scale: 0.97 },
        { scale: 1, ease: "none", scrollTrigger: { trigger: cardRef.current, start: "top 92%", end: "top 40%", scrub: 0.5 } }
      );
    }, cardRef);
    return () => ctx.revert();
  }, []);

  return (
    <section data-surface="soft" className="s-soft border-t border-linesoft" aria-label="Featured work">
      <div className="mx-auto w-full max-w-shell px-5 py-24 md:px-8 md:py-32 lg:px-12">
        <SectionHead
          lines={["Real Work.", "Real Results."]}
          side={
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between md:gap-10">
              <p className="max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
                We partner with businesses to build software that solves real problems and
                creates measurable impact.
              </p>
              <TransitionLink
                href="/work"
                className="label-tech whitespace-nowrap text-fog transition-colors duration-300 hover:text-fog-dim"
              >
                View All Work <span aria-hidden="true">↗</span>
              </TransitionLink>
            </div>
          }
        />

        <div
          ref={cardRef}
          className="s-dark group relative overflow-hidden rounded-2xl border border-line bg-card will-change-transform"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Info */}
            <div className="flex flex-col justify-between p-7 md:p-12 lg:col-span-6 lg:p-16">
              <div>
                <FadeUp>
                  <div className="flex items-center justify-end">
                    <TransitionLink
                      href="/work"
                      data-cursor="VIEW →"
                      aria-label="View the CITN case study"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-fg/15 text-xs text-fog-dim transition-all duration-500 hover:border-fg/40 hover:text-fog"
                    >
                      ↗
                    </TransitionLink>
                  </div>
                </FadeUp>
                <FadeUp delay={0.05}>
                  <h3 className="headline mt-8 text-[clamp(2.4rem,4.4vw,3.75rem)] text-fg">
                    {CITN.client}
                  </h3>
                  <p className="label-tech mt-3 text-fog-muted">{CITN.title}</p>
                </FadeUp>
                <FadeUp delay={0.1}>
                  <p className="mt-7 max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
                    {CITN.summary}
                  </p>
                </FadeUp>
              </div>

              <FadeUp delay={0.2} className="mt-12 flex flex-wrap items-center gap-6">
                <TransitionLink
                  href="/work"
                  className="inline-flex items-center gap-2 rounded-full border border-fg/20 px-6 py-3 text-xs tracking-[0.06em] text-fog uppercase transition-all duration-300 hover:bg-fg hover:text-ink-950"
                >
                  View Case Study <span aria-hidden="true">→</span>
                </TransitionLink>
                <TransitionLink
                  external
                  href={CITN.live.href}
                  className="text-xs text-fog-muted transition-colors duration-300 hover:text-fog"
                >
                  Live: {CITN.live.label} <span aria-hidden="true">↗</span>
                </TransitionLink>
              </FadeUp>
            </div>

            {/* Visual */}
            <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-ink-900 p-6 lg:col-span-6 lg:min-h-full md:p-10">
              <CitnBrowserFrame className="w-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
