"use client";

import SectionHead from "@/components/motion/SectionHead";
import RevealLines from "@/components/motion/RevealLines";
import FadeUp from "@/components/motion/FadeUp";
import ImageReveal from "@/components/motion/ImageReveal";
import TransitionLink from "@/components/motion/TransitionLink";
import CitnBrowserFrame from "@/components/work/CitnBrowserFrame";
import { CITN, EXPERIMENTS } from "@/lib/constants";

export default function WorkPage() {
  return (
    <div className="s-soft pt-[60px] md:pt-[72px]">
      <section data-surface="soft" className="mx-auto w-full max-w-shell px-5 pb-20 pt-14 md:px-8 md:pb-28 md:pt-24 lg:px-12">
        <SectionHead
          lines={["Real Work.", "Real Results."]}
          side={
            <p className="max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
              We partner with businesses to build software that solves real problems and
              creates measurable impact.
            </p>
          }
        />

        {/* ---- CITN case study ---- */}
        <article className="s-dark overflow-hidden rounded-2xl border border-line bg-card">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="flex flex-col justify-between p-7 md:p-12 lg:col-span-6 lg:p-16">
              <div>
                <FadeUp>
                  <div className="flex items-center">
                    <span className="label-tech text-fog-muted">Case Study</span>
                  </div>
                </FadeUp>
                <RevealLines
                  as="h2"
                  lines={[CITN.client]}
                  className="headline mt-8 text-[clamp(2.6rem,5vw,4.25rem)] text-fg"
                />
                <FadeUp delay={0.08}>
                  <p className="label-tech mt-3 text-fog-muted">{CITN.title}</p>
                </FadeUp>
                <FadeUp delay={0.12}>
                  <p className="mt-7 max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
                    {CITN.summary}
                  </p>
                </FadeUp>
              </div>
              <FadeUp delay={0.2} className="mt-12">
                <TransitionLink
                  external
                  href={CITN.live.href}
                  className="inline-flex items-center gap-2 rounded-full border border-fg/20 px-6 py-3 text-xs uppercase tracking-[0.06em] text-fog transition-all duration-300 hover:bg-fg hover:text-ink-950"
                >
                  Visit Live System <span aria-hidden="true">↗</span>
                </TransitionLink>
              </FadeUp>
            </div>

            <ImageReveal from="right" className="min-h-[320px] bg-ink-900 lg:col-span-6 lg:min-h-full">
              <div className="flex h-full items-center justify-center p-6 md:p-12">
                <CitnBrowserFrame className="w-full" />
              </div>
            </ImageReveal>
          </div>

          {/* Detail columns */}
          <div className="hairline-t grid grid-cols-1 md:grid-cols-3">
            <div className="p-7 md:p-10">
              <FadeUp>
                <h3 className="label-tech text-fog-muted">Background</h3>
                <p className="mt-4 text-sm leading-relaxed text-fog-dim">{CITN.background}</p>
              </FadeUp>
            </div>
            <div className="border-t border-linesoft p-7 md:border-l md:border-t-0 md:p-10">
              <FadeUp delay={0.06}>
                <h3 className="label-tech text-fog-muted">Approach</h3>
                <ul className="mt-4 space-y-3">
                  {CITN.approach.map((a) => (
                    <li key={a} className="flex gap-3 text-sm leading-relaxed text-fog-dim">
                      <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-fg/30" />
                      {a}
                    </li>
                  ))}
                </ul>
              </FadeUp>
            </div>
            <div className="border-t border-linesoft p-7 md:border-l md:border-t-0 md:p-10">
              <FadeUp delay={0.12}>
                <h3 className="label-tech text-fog-muted">Outcome</h3>
                <p className="mt-4 text-sm leading-relaxed text-fog-dim">{CITN.outcome}</p>
              </FadeUp>
            </div>
          </div>
        </article>

        <FadeUp className="mt-6 flex items-center justify-between text-xs text-fog-muted">
          <span>Additional case studies will be published as client work ships.</span>
          
        </FadeUp>
      </section>

      {/* ---- Experiments (explicitly not client work) ---- */}
      <section data-surface="dark" className="s-dark border-t border-linesoft" aria-label="Experiments">
        <div className="mx-auto w-full max-w-shell px-5 py-24 md:px-8 md:py-28 lg:px-12">
          <FadeUp>
            <span className="label-tech text-fog-muted">Experiments — Internal R&amp;D</span>
          </FadeUp>
          <div className="mt-5 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <RevealLines
              lines={["Internal research,", "not client work."]}
              className="headline text-[clamp(2rem,3.6vw,3rem)] text-fog"
            />
            <FadeUp delay={0.1}>
              <p className="max-w-md text-sm leading-relaxed text-fog-dim">
                Prototypes and research systems we build in-house to stay sharp. They are
                not client engagements and are listed here for transparency only.
              </p>
            </FadeUp>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXPERIMENTS.map((x, i) => (
              <li key={x.name}>
                <FadeUp delay={i * 0.06} y={20}>
                  <div className="rounded-xl border border-line bg-ink-800 p-5 transition-colors duration-500 hover:border-fg/25">
                    <span className="text-[10px] tracking-tech text-fog-muted">0{i + 1}</span>
                    <h3 className="mt-3 text-sm font-medium text-fog">{x.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-fog-muted">{x.note}</p>
                  </div>
                </FadeUp>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-surface="deep" className="s-deep border-t border-linesoft">
        <div className="mx-auto flex w-full max-w-shell flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center md:px-8 lg:px-12">
          <p className="text-sm text-fog-dim">
            Have a system that needs rebuilding? Tell us what it does today.
          </p>
          <TransitionLink href="/contact" className="label-tech text-fog transition-colors hover:text-fog-dim">
            Start a Conversation <span aria-hidden="true">→</span>
          </TransitionLink>
        </div>
      </section>
    </div>
  );
}
