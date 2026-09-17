"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Detects which section surface sits behind the fixed navigation bar
 * (probe line at nav mid-height) so nav chrome can adapt its colours.
 * Sections declare themselves with [data-surface="dark|light|soft|deep|black"].
 */
export function useNavSurface(): "dark" | "light" {
  const [tone, setTone] = useState<"dark" | "light">("dark");
  const pathname = usePathname();

  /* re-runs on every route change so the nav matches the new page's top
     surface immediately — no stale tone carried across navigations */
  useEffect(() => {
    let raf = 0;
    const probe = () => {
      const y = 36;
      let cur: string | null = null;
      let next: string | null = null;
      let last: string | null = null;
      const els = Array.from(document.querySelectorAll("[data-surface]"));
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const surf = el.getAttribute("data-surface") || "dark";
        last = surf;
        if (r.top <= y && r.bottom > y) cur = surf;
        /* nearest section below the probe line — covers the nav-offset gap
           above a page's first section so the tone is right at scroll 0 */
        if (next === null && r.bottom > y) next = surf;
      }
      const surface = cur ?? next ?? last ?? "dark";
      setTone(surface === "light" || surface === "soft" ? "light" : "dark");
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(probe);
    };
    const timers = [window.setTimeout(probe, 120), window.setTimeout(probe, 900)];
    probe();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return tone;
}
