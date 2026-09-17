"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type MouseEvent,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import Lenis from "lenis";
import { ensureGsap, gsap, ScrollTrigger } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/prefs";

type TransitionCtx = {
  navigate: (href: string, e?: MouseEvent) => boolean;
  scrollToHash: (hash: string) => void;
};

const Ctx = createContext<TransitionCtx | null>(null);

export function useTransitionRouter(): TransitionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTransitionRouter must be used within TransitionProvider");
  return ctx;
}

function splitHref(href: string): { path: string; hash: string } {
  const i = href.indexOf("#");
  if (i === -1) return { path: href || "/", hash: "" };
  return { path: href.slice(0, i) || "/", hash: href.slice(i) };
}

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const busyRef = useRef(false);
  const pendingHashRef = useRef<string | null>(null);
  const coveredRef = useRef(false);
  const firstRenderRef = useRef(true);

  /* Lenis smooth scrolling + ScrollTrigger sync */
  useEffect(() => {
    ensureGsap();
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenisRef.current = lenis;
    lenis.on("scroll", () => ScrollTrigger.update());
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  /* Overlay initial state */
  useEffect(() => {
    ensureGsap();
    gsap.set(panelRef.current, { yPercent: 101 });
    gsap.set(markRef.current, { autoAlpha: 0, scale: 0.94 });
  }, []);

  const scrollToHash = useCallback((hash: string, immediate = false) => {
    const el = document.querySelector(hash);
    if (!el) return;
    const top = (el as HTMLElement).getBoundingClientRect().top + window.scrollY - 84;
    const lenis = lenisRef.current;
    if (!lenis || prefersReducedMotion()) {
      window.scrollTo({ top, behavior: immediate ? "auto" : "smooth" });
      return;
    }
    if (immediate) {
      // Native jump while the overlay covers; Lenis resyncs on uncover.
      window.scrollTo(0, top);
      return;
    }
    lenis.scrollTo(top, { duration: 1.1 });
  }, []);

  /* Route changed: settle scroll position, then uncover */
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    ensureGsap();
    const hash = pendingHashRef.current;
    pendingHashRef.current = null;

    if (hash) {
      window.scrollTo(0, 0);
      scrollToHash(hash, true);
    } else if (coveredRef.current) {
      window.scrollTo(0, 0);
    }

    if (coveredRef.current) {
      coveredRef.current = false;
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(panelRef.current, { yPercent: 101 });
          busyRef.current = false;
          const lenis = lenisRef.current;
          if (lenis) {
            // Resync Lenis' target with the DOM position before resuming.
            lenis.scrollTo(window.scrollY, { immediate: true });
            lenis.start();
          }
          ScrollTrigger.refresh();
        },
      });
      tl.to(markRef.current, { autoAlpha: 0, scale: 0.96, duration: 0.28, ease: "power2.in" })
        .to(panelRef.current, { yPercent: -101, duration: 0.62, ease: "power4.inOut" }, "-=0.05");
    } else {
      requestAnimationFrame(() => ScrollTrigger.refresh());
    }
  }, [pathname, scrollToHash]);

  const navigate = useCallback(
    (href: string, e?: MouseEvent): boolean => {
      if (e && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return true;
      const { path, hash } = splitHref(href);
      const samePath = path === pathname;

      if (samePath) {
        e?.preventDefault();
        if (hash) scrollToHash(hash);
        else if (lenisRef.current) lenisRef.current.scrollTo(0, { duration: 1 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return false;
      }

      e?.preventDefault();
      ensureGsap();
      if (prefersReducedMotion() || busyRef.current) {
        router.push(hash ? `${path}${hash}` : path);
        return false;
      }

      busyRef.current = true;
      coveredRef.current = true;
      pendingHashRef.current = hash || null;
      lenisRef.current?.stop();

      const tl = gsap.timeline({
        onComplete: () => router.push(hash ? `${path}${hash}` : path),
      });
      tl.to(panelRef.current, { yPercent: 0, duration: 0.46, ease: "power4.inOut" })
        .to(
          markRef.current,
          { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power2.out" },
          "-=0.16"
        );
      return false;
    },
    [pathname, router, scrollToHash]
  );

  const value = useMemo(() => ({ navigate, scrollToHash }), [navigate, scrollToHash]);


  return (
    <Ctx.Provider value={value}>
      {children}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[95]">
        <div
          ref={panelRef}
          className="absolute inset-0 flex items-center justify-center bg-ink-950"
        >
          <div ref={markRef} className="opacity-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-lockup.png" alt="" className="h-6 w-auto md:h-7" />
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
