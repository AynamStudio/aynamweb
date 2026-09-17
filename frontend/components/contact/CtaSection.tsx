"use client";

import RevealLines from "@/components/motion/RevealLines";
import FadeUp from "@/components/motion/FadeUp";
import Magnetic from "@/components/motion/Magnetic";
import TransitionLink from "@/components/motion/TransitionLink";
import dynamic from "next/dynamic";

const EarthGlobe = dynamic(() => import("@/components/contact/EarthGlobe"), {
  ssr: false,
  loading: () => null,
});
import { CTA } from "@/lib/constants";

export default function CtaSection() {
  return (
    <section data-surface="deep" className="s-deep relative overflow-hidden border-t border-linesoft" aria-label="Start a project">
      <div className="mx-auto grid w-full max-w-shell grid-cols-1 items-center gap-14 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-12 lg:gap-12 lg:px-12">
        <div className="lg:col-span-7">
          <FadeUp>
            <span className="label-tech text-fog-muted">{CTA.label}</span>
          </FadeUp>
          <RevealLines
            lines={CTA.lines}
            className="headline mt-5 text-[clamp(2.6rem,5vw,4.5rem)] text-fog"
          />
          <FadeUp delay={0.1}>
            <p className="mt-7 max-w-md text-sm leading-relaxed text-fog-dim md:text-base">{CTA.body}</p>
          </FadeUp>
          <FadeUp delay={0.16} className="mt-10">
            <Magnetic>
              <TransitionLink
                href={CTA.button.href}
                className="inline-flex items-center gap-2 rounded-full bg-fg px-8 py-3.5 text-sm font-medium text-ink-950 transition-colors duration-300 hover:bg-fg/90"
              >
                {CTA.button.label} <span aria-hidden="true">→</span>
              </TransitionLink>
            </Magnetic>
          </FadeUp>
        </div>

        <div className="flex justify-center lg:col-span-5 lg:justify-end">
          <FadeUp y={30} duration={1.1}>
            <EarthGlobe className="h-[240px] w-[240px] sm:h-80 sm:w-80 lg:h-[360px] lg:w-[360px]" />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
