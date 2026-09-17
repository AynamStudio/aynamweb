"use client";

import type { ReactNode } from "react";
import RevealLines from "./RevealLines";
import FadeUp from "./FadeUp";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  lines: readonly string[];
  side?: ReactNode;
  className?: string;
  headingClassName?: string;
  id?: string;
};

/** Shared editorial section header: optional label, masked heading, side copy. */
export default function SectionHead({ label, lines, side, className, headingClassName, id }: Props) {
  return (
    <header className={cn("mb-14 md:mb-20", className)} id={id}>
      {label ? (
        <FadeUp>
          <span className="label-tech text-fog-muted">{label}</span>
        </FadeUp>
      ) : null}
      <div className={cn("flex flex-col gap-8 md:flex-row md:items-end md:justify-between", label && "mt-5")}>
        <RevealLines
          lines={lines}
          className={cn(
            "headline text-[clamp(2.5rem,4.8vw,4.25rem)] text-fog",
            headingClassName
          )}
        />
        {side ? (
          <FadeUp delay={0.1} className="max-w-xl md:pb-2">
            {side}
          </FadeUp>
        ) : null}
      </div>
    </header>
  );
}
