"use client";

import Image from "next/image";
import Parallax from "@/components/motion/Parallax";
import RevealLines from "@/components/motion/RevealLines";
import FadeUp from "@/components/motion/FadeUp";
import { WHY } from "@/lib/constants";

const ICONS: Record<string, React.ReactNode> = {
  target: (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M8 1.6 13 3.4v4.2c0 3.2-2.1 5.6-5 6.8-2.9-1.2-5-3.6-5-6.8V3.4L8 1.6Z" />
      <path d="m5.8 7.9 1.6 1.6 2.8-3" />
    </svg>
  ),
  path: (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M2.5 12.5h6a3 3 0 0 0 0-6h-1a3 3 0 0 1 0-6h6" />
      <path d="m11.5 2.5 2 2-2 2" transform="translate(0,-2)" />
    </svg>
  ),
  loop: (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      <path d="M4.5 5.5c-2 1.6-2 3.4 0 5s4 .9 5.5-.9c1.5-1.8 3.5-2.5 5.5-.9" transform="translate(-1.5,0)" />
      <path d="M11.5 10.5c2-1.6 2-3.4 0-5s-4-.9-5.5.9C4.5 8.2 2.5 8.9.5 7.3" transform="translate(1.5,0)" />
    </svg>
  ),
};

export default function WhyAynam() {
  return (
    <section id="partners" data-surface="light" className="s-light border-t border-linesoft scroll-mt-24" aria-label="Why AYNAM">
      <div className="mx-auto w-full max-w-shell px-5 py-24 md:px-8 md:py-32 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Parallax className="aspect-[4/5] rounded-2xl border border-line bg-ink-900" strength={6}>
              <Image
                src="/images/why-aynam.jpg"
                alt="The AYNAM studio wall — monochrome prints, strategy books and a systems sketch on the table"
                fill
                loading="lazy"
                sizes="(min-width: 1024px) 40vw, 92vw"
                className="object-cover"
              />
            </Parallax>
          </div>

          <div className="lg:col-span-7">
            <RevealLines
              lines={WHY.lines}
              className="headline mt-5 text-[clamp(2.3rem,4.4vw,3.75rem)] text-fog"
            />
            <FadeUp delay={0.1}>
              <p className="mt-7 max-w-xl text-sm leading-relaxed text-fog-dim md:text-base">{WHY.body}</p>
            </FadeUp>

            <ul className="hairline-t mt-12 grid grid-cols-1 gap-x-8 gap-y-10 pt-10 sm:grid-cols-2">
              {WHY.principles.map((p, i) => (
                <li key={p.title}>
                  <FadeUp delay={0.08 * i}>
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-fg/20 text-fg/80">
                        {ICONS[p.icon]}
                      </span>
                      <div>
                        <h3 className="text-sm font-medium text-fog">{p.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-fog-muted">{p.body}</p>
                      </div>
                    </div>
                  </FadeUp>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
