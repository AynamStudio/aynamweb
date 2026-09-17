"use client";

import Image from "next/image";
import SectionHead from "@/components/motion/SectionHead";
import FadeUp from "@/components/motion/FadeUp";
import TransitionLink from "@/components/motion/TransitionLink";
import { INDUSTRIES } from "@/lib/constants";

export default function IndustriesPage() {
  return (
    <div className="s-light pt-[60px] md:pt-[72px]">
      <section data-surface="light" className="mx-auto w-full max-w-shell px-5 pb-20 pt-14 md:px-8 md:pb-28 md:pt-24 lg:px-12">
        <SectionHead
          lines={["Built for", "Real Industries."]}
          side={
            <p className="max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
              Every industry has unique challenges. We build tailored solutions that fit
              your world.
            </p>
          }
        />

        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <li key={ind.name}>
              <FadeUp delay={i * 0.06} y={24}>
                <div
                  data-cursor="EXPLORE"
                  className="group overflow-hidden rounded-xl border border-line bg-card"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink-900">
                    <Image
                      src={ind.image}
                      alt={ind.alt}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 92vw"
                      className="mono-img object-cover transition-transform duration-[1300ms] ease-expo group-hover:scale-[1.05]"
                    />
                  </div>
                  <div className="flex items-end justify-between gap-4 p-4 md:p-5">
                    <div>
                      <h2 className="text-sm text-fog md:text-base">{ind.name}</h2>
                      <p className="mt-1 max-w-[26ch] text-xs leading-relaxed text-fog-dim">
                        {ind.line}
                      </p>
                    </div>
                    <span className="label-tech text-[9px] text-fog-muted">0{i + 1}</span>
                  </div>
                </div>
              </FadeUp>
            </li>
          ))}
        </ul>
      </section>

      <section data-surface="dark" className="s-dark border-t border-linesoft">
        <div className="mx-auto flex w-full max-w-shell flex-col items-start justify-between gap-6 px-5 py-14 md:flex-row md:items-center md:px-8 lg:px-12">
          <p className="max-w-xl text-sm leading-relaxed text-fog-dim">
            If your industry isn&apos;t listed, tell us what you operate. We&apos;ll give you
            an honest read on whether we&apos;re the right team for it.
          </p>
          <TransitionLink href="/contact" className="label-tech text-fog transition-colors hover:text-fog-dim">
            Start a Conversation <span aria-hidden="true">→</span>
          </TransitionLink>
        </div>
      </section>
    </div>
  );
}
