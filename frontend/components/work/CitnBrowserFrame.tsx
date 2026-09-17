"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * CITN product visual: the live system screenshot presented inside a quiet
 * browser frame. The frame matches the screenshot's exact aspect ratio, so
 * the interface is never awkwardly cropped — intentional alignment at every
 * breakpoint, monochrome-treated to stay inside the AYNAM system.
 */
export default function CitnBrowserFrame({ className }: { className?: string }) {
  return (
    <figure
      data-cursor="EXPLORE"
      className={cn(
        "group m-0 overflow-hidden rounded-lg border border-line bg-ink-800 frame-shadow",
        className
      )}
    >
      {/* browser chrome */}
      <div className="flex h-9 items-center gap-1.5 border-b border-linesoft bg-ink-900 px-4">
        <span className="h-2 w-2 rounded-full bg-fg/15" />
        <span className="h-2 w-2 rounded-full bg-fg/15" />
        <span className="h-2 w-2 rounded-full bg-fg/15" />
        <span className="ml-3 rounded border border-linesoft bg-fg/5 px-2.5 py-0.5 text-[10px] tracking-[0.04em] text-fog-muted">
          citn.in
        </span>
      </div>
      {/* exact-ratio viewport: zero crop */}
      <div className="relative aspect-[1875/903] overflow-hidden bg-ink-900">
        <Image
          src="/images/work/citn.jpg"
          alt="CITN ERP system interface — screenshot of the live product at citn.in"
          fill
          sizes="(min-width: 1024px) 44vw, 92vw"
          className="object-cover transition-transform duration-[1600ms] ease-expo group-hover:scale-[1.035]"
        />
      </div>
    </figure>
  );
}
