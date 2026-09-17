"use client";

import RevealLines from "@/components/motion/RevealLines";
import FadeUp from "@/components/motion/FadeUp";
import dynamic from "next/dynamic";
import ContactForm from "@/components/contact/ContactForm";
import { CTA } from "@/lib/constants";

const EarthGlobe = dynamic(() => import("@/components/contact/EarthGlobe"), {
  ssr: false,
  loading: () => null,
});

/**
 * Closing CTA on the landing page.
 *
 * Per the update brief the old "Start a Conversation →" link to /contact is
 * replaced by an inline composition:
 *   LEFT  : form (same field set as /contact) — submits to same-origin
 *           /api/contact which sends SMTP directly from Vercel and proxies
 *           to the backend CRM for lead persistence.
 *   RIGHT : existing EarthGlobe (Three.js monochrome) — reused, not duplicated.
 *
 * On mobile the globe sits above the form so the lead-in headline reads
 * naturally before the input surface.
 */
export default function CtaSection() {
  return (
    <section
      data-surface="deep"
      className="s-deep relative overflow-hidden border-t border-linesoft"
      aria-label="Start a project"
      id="lets-build"
    >
      <div className="mx-auto grid w-full max-w-shell grid-cols-1 items-start gap-14 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-12 lg:gap-12 lg:px-12">
        {/* LEFT: eyebrow + headline + inline form */}
        <div className="lg:col-span-7">
          <FadeUp>
            <span className="label-tech text-fog-muted">{CTA.label}</span>
          </FadeUp>
          <RevealLines
            lines={CTA.lines}
            className="headline mt-5 text-[clamp(2.4rem,4.8vw,4.25rem)] text-fog"
          />
          <FadeUp delay={0.1}>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-fog-dim md:text-base">
              {CTA.body}
            </p>
          </FadeUp>

          <FadeUp delay={0.16} className="mt-10 md:mt-12">
            <div className="relative">
              <ContactForm />
            </div>
          </FadeUp>
        </div>

        {/* RIGHT: Earth globe + supporting line, pinned top on desktop */}
        <div className="flex flex-col items-center gap-6 lg:sticky lg:top-24 lg:col-span-5 lg:items-end lg:self-start">
          <FadeUp y={30} duration={1.1}>
            <EarthGlobe className="h-[240px] w-[240px] sm:h-80 sm:w-80 lg:h-[380px] lg:w-[380px]" />
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-center text-xs leading-relaxed text-fog-muted lg:text-right">
              Independent software studio.<br />
              Est. 2026 · <span className="text-fog-dim">aynam.in</span>
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
