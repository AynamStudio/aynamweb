"use client";

import Image from "next/image";
import SectionHead from "@/components/motion/SectionHead";
import FadeUp from "@/components/motion/FadeUp";
import ImageReveal from "@/components/motion/ImageReveal";
import TransitionLink from "@/components/motion/TransitionLink";
import { CAPABILITIES, PROCESS } from "@/lib/constants";

export default function ServicesPage() {
  return (
    <div className="s-light pt-[60px] md:pt-[72px]">
      <section data-surface="light" className="mx-auto w-full max-w-shell px-5 pb-8 pt-14 md:px-8 md:pt-24 lg:px-12">
        <SectionHead
          lines={["What", "We Do"]}
          side={
            <p className="max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
              From modernizing legacy systems to building AI-powered products, we help
              businesses turn complexity into opportunity.
            </p>
          }
        />
      </section>

      <section data-surface="light" className="mx-auto w-full max-w-shell px-5 pb-24 md:px-8 md:pb-32 lg:px-12">
        {CAPABILITIES.map((cap, i) => (
          <div key={cap.index} className="hairline-t group grid grid-cols-1 gap-8 py-10 md:py-14 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <FadeUp>
                <span className="label-tech text-fog-muted">{cap.index}</span>
                <h2 className="headline mt-4 text-[clamp(1.75rem,3vw,2.5rem)] text-fog transition-transform duration-500 ease-expo group-hover:translate-x-1">
                  {cap.title.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </h2>
              </FadeUp>
            </div>
            <div className="lg:col-span-4">
              <FadeUp delay={0.06}>
                <p className="text-sm leading-relaxed text-fog-dim md:text-base">{cap.blurb}</p>
                <ul className="mt-6 space-y-2.5">
                  {cap.scope.map((s) => (
                    <li key={s} className="flex gap-3 text-sm leading-relaxed text-fog-dim">
                      <span aria-hidden="true" className="mt-[9px] h-px w-3 shrink-0 bg-fg/30" />
                      {s}
                    </li>
                  ))}
                </ul>
              </FadeUp>
            </div>
            <div className="lg:col-span-4">
              <FadeUp delay={0.1}>
                <ImageReveal from={i % 2 === 0 ? "right" : "left"} className="aspect-[16/10] rounded-lg border border-line bg-ink-900">
                  <Image
                    src={cap.image}
                    alt={cap.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 1024px) 30vw, 90vw"
                    className="mono-img object-cover transition-transform duration-[1400ms] ease-expo group-hover:scale-[1.05]"
                  />
                </ImageReveal>
              </FadeUp>
            </div>
          </div>
        ))}
      </section>

      <section data-surface="dark" className="s-dark border-t border-linesoft" aria-label="How we work">
        <div className="mx-auto w-full max-w-shell px-5 py-24 md:px-8 md:py-28 lg:px-12">
          <FadeUp>
            <span className="label-tech text-fog-muted">How We Work</span>
          </FadeUp>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((p, i) => (
              <div key={p.index}>
                <FadeUp delay={i * 0.07}>
                  <span className="text-[11px] font-semibold text-fog-dim">{p.index}</span>
                  <h3 className="mt-4 text-lg text-fog">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-fog-dim">{p.body}</p>
                </FadeUp>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-surface="deep" className="s-deep border-t border-linesoft">
        <div className="mx-auto flex w-full max-w-shell flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center md:px-8 lg:px-12">
          <p className="max-w-md text-sm text-fog-dim">
            Not sure where to start? Tell us what hurts — we&apos;ll tell you honestly what
            we&apos;d do about it.
          </p>
          <TransitionLink href="/contact" className="label-tech text-fog transition-colors hover:text-fog-dim">
            Start a Conversation <span aria-hidden="true">→</span>
          </TransitionLink>
        </div>
      </section>
    </div>
  );
}
