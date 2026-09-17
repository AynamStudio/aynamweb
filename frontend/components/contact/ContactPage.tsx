"use client";

import RevealLines from "@/components/motion/RevealLines";
import FadeUp from "@/components/motion/FadeUp";
import dynamic from "next/dynamic";

const EarthGlobe = dynamic(() => import("@/components/contact/EarthGlobe"), {
  ssr: false,
  loading: () => null,
});
import { CONTACT_EMAIL, CTA, SOCIALS, SOCIAL_HANDLE } from "@/lib/constants";
import ContactForm from "@/components/contact/ContactForm";

const NEXT_STEPS = [
  { index: "01", text: "A short conversation about the problem — not a sales call." },
  { index: "02", text: "An honest read on scope, fit and budget, in writing." },
  { index: "03", text: "A plan you can hold us to, with working software early." },
];

export default function ContactPage() {
  return (
    <div className="s-deep pt-[60px] md:pt-[72px]">
      <section data-surface="deep" className="mx-auto grid w-full max-w-shell grid-cols-1 gap-14 px-5 pb-24 pt-14 md:px-8 md:pb-32 md:pt-24 lg:grid-cols-12 lg:gap-12 lg:px-12">
        <div className="lg:col-span-7">
          <FadeUp>
            <span className="label-tech text-fog-muted">{CTA.label}</span>
          </FadeUp>
          <RevealLines
            lines={CTA.lines}
            as="h1"
            className="headline mt-5 text-[clamp(2.6rem,5.4vw,4.75rem)] text-fog"
          />
          <FadeUp delay={0.1}>
            <p className="mt-7 max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
              {CTA.body}
            </p>
          </FadeUp>

          {CONTACT_EMAIL ? (
            <FadeUp delay={0.16} className="mt-10">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="inline-flex items-center gap-2 rounded-full bg-fg px-8 py-3.5 text-sm font-medium text-ink-950 transition-colors duration-300 hover:bg-fg/90"
              >
                {CONTACT_EMAIL} <span aria-hidden="true">→</span>
              </a>
            </FadeUp>
          ) : (
            <FadeUp delay={0.16}>
              <p className="mt-10 max-w-md border-l border-line pl-5 text-sm leading-relaxed text-fog-muted">
                Our public inbox is being set up. Until then, a direct message on any channel
                below reaches the studio fastest. We reply to every serious enquiry — usually
                with questions, sometimes with a better idea.
              </p>
            </FadeUp>
          )}

          <div className="mt-14">
            <FadeUp>
              <h2 className="label-tech text-fog-muted">Direct Channels</h2>
            </FadeUp>
            <ul className="hairline-t mt-5">
              {SOCIALS.map((s, i) => (
                <li key={s.label} className="border-b border-linesoft">
                  <FadeUp delay={0.05 * i}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cursor="VIEW →"
                      className="group flex items-center justify-between py-5"
                    >
                      <span className="flex items-baseline gap-4">
                        <span className="text-sm text-fog transition-transform duration-500 ease-expo group-hover:translate-x-1">
                          {s.label}
                        </span>
                        <span className="text-xs text-fog-muted">{SOCIAL_HANDLE}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-xs text-fog-muted transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-fog"
                      >
                        ↗
                      </span>
                    </a>
                  </FadeUp>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14">
            <FadeUp>
              <h2 className="label-tech text-fog-muted">What Happens Next</h2>
            </FadeUp>
            <ol className="mt-6 space-y-5">
              {NEXT_STEPS.map((n, i) => (
                <li key={n.index}>
                  <FadeUp delay={0.06 * i}>
                    <span className="flex gap-4 text-sm leading-relaxed text-fog-dim">
                      <span className="text-[11px] font-semibold text-fog-muted">{n.index}</span>
                      {n.text}
                    </span>
                  </FadeUp>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 lg:col-span-5 lg:items-end">
          <FadeUp y={30} duration={1.1}>
            <EarthGlobe className="h-[240px] w-[240px] sm:h-80 sm:w-80 lg:h-[340px] lg:w-[340px]" />
          </FadeUp>
          <FadeUp delay={0.2}>
            <p className="text-xs text-fog-muted">Independent software studio. Est. 2026.</p>
          </FadeUp>
        </div>
      </section>

      <section
        data-surface="deep"
        className="s-deep border-t border-linesoft"
        aria-labelledby="contact-form-heading"
      >
        <div className="mx-auto w-full max-w-shell px-5 py-24 md:px-8 md:py-32 lg:px-12">
          <FadeUp>
            <span className="label-tech text-fog-muted">Start a Project</span>
          </FadeUp>
          <RevealLines
            id="contact-form-heading"
            lines={["Tell us what", "you're building."]}
            as="h2"
            className="headline mt-5 text-[clamp(2.2rem,4.4vw,3.6rem)] text-fog"
          />
          <FadeUp delay={0.1}>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
              Share as much or as little as you like — the basics are enough to
              start a conversation.
            </p>
          </FadeUp>
          <FadeUp delay={0.16} className="mt-14 max-w-3xl">
            <ContactForm />
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
