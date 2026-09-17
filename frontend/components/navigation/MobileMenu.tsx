"use client";

import { useEffect, useRef } from "react";
import TransitionLink from "@/components/motion/TransitionLink";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/prefs";
import { NAV_LINKS, SOCIALS, SOCIAL_HANDLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    ensureGsap();
    const items = ref.current.querySelectorAll("[data-menu-item]");
    const meta = ref.current.querySelectorAll("[data-menu-meta]");
    if (open) {
      document.body.style.overflow = "hidden";
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ delay: 0.08 });
      tl.fromTo(items, { yPercent: 110 }, { yPercent: 0, duration: 0.7, stagger: 0.06, ease: "expo.out" })
        .fromTo(meta, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05 }, "-=0.3");
      playedRef.current = true;
    } else {
      document.body.style.overflow = "";
      if (playedRef.current && !prefersReducedMotion()) {
        gsap.set(items, { yPercent: 110 });
        gsap.set(meta, { autoAlpha: 0 });
      }
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div
      id="mobile-menu"
      ref={ref}
      aria-hidden={!open}
      className={cn(
        "fixed inset-0 z-[55] bg-ink-950 transition-[clip-path] duration-500 ease-expo md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      style={{ clipPath: open ? "inset(0 0 0% 0)" : "inset(0 0 100% 0)" }}
    >
      <div className="flex h-full flex-col justify-between px-5 pb-8 pt-24">
        <nav aria-label="Mobile" className="flex flex-col gap-1">
          {NAV_LINKS.map((link, i) => (
            <span key={link.label} className="mask-line">
              <span data-menu-item className={cn(!open && "translate-y-[110%]")}>
                <TransitionLink
                  href={link.href}
                  onClick={onClose}
                  className="headline block py-1.5 text-[clamp(2rem,9vw,2.75rem)] text-fog"
                >
                  <span className="mr-3 align-middle text-[10px] tracking-tech text-fog-muted">
                    0{i + 1}
                  </span>
                  {link.label}
                </TransitionLink>
              </span>
            </span>
          ))}
        </nav>
        <div className="space-y-4">
          <div data-menu-meta className={cn("hairline-t pt-5", !open && "opacity-0")}>
            <TransitionLink
              href="/contact"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full bg-fg px-5 py-2.5 text-sm font-medium text-ink-950"
            >
              Let&apos;s Build Something <span aria-hidden="true">→</span>
            </TransitionLink>
          </div>
          <div data-menu-meta className={cn("flex items-center gap-6", !open && "opacity-0")}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-fog-dim transition-colors hover:text-fog"
              >
                {s.label}
              </a>
            ))}
            <span className="ml-auto text-xs text-fog-muted">{SOCIAL_HANDLE}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
