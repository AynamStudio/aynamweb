"use client";

import Image from "next/image";
import SectionHead from "@/components/motion/SectionHead";
import FadeUp from "@/components/motion/FadeUp";
import TransitionLink from "@/components/motion/TransitionLink";
import { INDUSTRIES } from "@/lib/constants";

export default function IndustriesGrid() {
  return (
    <section data-surface="dark" className="s-dark border-t border-linesoft" aria-label="Industries">
      <div className="mx-auto w-full max-w-shell px-5 py-24 md:px-8 md:py-32 lg:px-12">
        <SectionHead
          lines={["Built for", "Real Industries."]}
          side={
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between md:gap-10">
              <p className="max-w-md text-sm leading-relaxed text-fog-dim md:text-base">
                Every industry has unique challenges. We build tailored solutions that fit
                your world.
              </p>
              <TransitionLink
                href="/industries"
                className="label-tech whitespace-nowrap text-fog transition-colors duration-300 hover:text-fog-dim"
              >
                Explore Industries <span aria-hidden="true">↗</span>
              </TransitionLink>
            </div>
          }
        />

        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {INDUSTRIES.map((ind, i) => (
            <li key={ind.name}>
              <FadeUp delay={i * 0.06} y={24}>
                <TransitionLink
                  href="/industries"
                  data-cursor="EXPLORE"
                  className="group block overflow-hidden rounded-xl border border-line bg-card"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-ink-900">
                    <Image
                      src={ind.image}
                      alt={ind.alt}
                      fill
                      loading="lazy"
                      sizes="(min-width: 1024px) 15vw, (min-width: 768px) 30vw, 45vw"
                      className="mono-img object-cover transition-transform duration-[1300ms] ease-expo group-hover:scale-[1.06]"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3 md:p-3.5">
                    <span className="text-xs text-fog md:text-[13px]">{ind.name}</span>
                    <span className="label-tech text-[9px] text-fog-muted opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      0{i + 1}
                    </span>
                  </div>
                </TransitionLink>
              </FadeUp>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
