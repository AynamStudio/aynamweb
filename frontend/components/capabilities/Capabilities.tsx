"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import RevealLines from "@/components/motion/RevealLines";
import FadeUp from "@/components/motion/FadeUp";
import { CAPABILITIES } from "@/lib/constants";
import { ensureGsap, gsap } from "@/lib/motion/gsap";
import { prefersReducedMotion } from "@/lib/motion/prefs";
import { cn } from "@/lib/utils";

const N = CAPABILITIES.length;
const AUTOPLAY_S = 5;
const STEP_S = 1.1;

/** wrap distance into (-N/2, N/2] so the belt loop is seamless */
const wrap = (d: number) => {
  let x = d % N;
  if (x > N / 2) x -= N;
  if (x <= -N / 2) x += N;
  return x;
};

/**
 * WHAT WE DO — infinite horizontal 3D image chain.
 *
 * A single float (`pos`) drives the whole belt: every slide's wrapped distance
 * from centre interpolates x / scale / blur / opacity / rotateY / z, so the four
 * frames travel one continuous perspective loop (01→02→03→04→01…) with a
 * camera-focus feel — never a hard slider step. GSAP's ticker writes transforms
 * straight to the DOM (no per-frame React state); React state changes only when
 * the active index flips (service copy + progress).
 *
 * Autoplay: one step / 5s, paused on hover·drag·focus, resumed after 2.5s quiet.
 * Drag/swipe moves the entire chain with restrained momentum, snaps to nearest.
 * Arrows + ArrowLeft/ArrowRight step it. Reduced motion: static centred frame,
 * instant swaps, no belt, no parallax.
 */
export default function Capabilities() {
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const swapRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [active, setActive] = useState(0);
  const [shown, setShown] = useState(0);
  const [reduced, setReduced] = useState(false);

  const S = useRef({
    pos: 0,
    vel: 0,
    w: 1200,
    h: 600,
    slideW: 672,
    mobile: false,
    hover: 0,
    hoverT: 0,
    par: { x: 0, y: 0 },
    parT: { x: 0, y: 0 },
    dragging: false,
    quiet: null as { kill: () => void } | null,
  }).current;

  /* ---------- per-frame visual solve ---------- */
  const apply = () => {
    const sideX = S.slideW * (S.mobile ? 0.55 : 0.643);
    const farX = S.slideW * (S.mobile ? 0.775 : 0.929);
    const ryMax = S.mobile ? 6 : 10;
    S.hover += (S.hoverT - S.hover) * 0.12;
    S.par.x += (S.parT.x - S.par.x) * 0.08;
    S.par.y += (S.parT.y - S.par.y) * 0.08;
    const activeIdx = ((Math.round(S.pos) % N) + N) % N;

    for (let i = 0; i < N; i++) {
      const el = slideRefs.current[i];
      if (!el) continue;
      const d = wrap(i - S.pos);
      const ad = Math.min(Math.abs(d), 2);
      const sg = d === 0 ? 0 : d / Math.abs(d);
      let x: number, sc: number, bl: number, op: number, ry: number, z: number;
      if (ad <= 1) {
        const t = ad;
        x = sideX * d;
        sc = 1 - 0.24 * t;
        bl = 6 * t;
        op = 1 - 0.65 * t;
        ry = -ryMax * d;
        z = 120 * (1 - t);
      } else {
        const t = Math.min(ad - 1, 1);
        x = sg * (sideX + (farX - sideX) * t);
        sc = 0.76 - 0.1 * t;
        bl = 6 + 4 * t;
        op = 0.35 * (1 - t);
        ry = -ryMax * sg;
        z = -80 * t;
      }
      const focus = Math.max(0, 1 - ad * 2);
      sc *= 1 + 0.015 * S.hover * focus;
      const px = S.par.x * focus;
      const py = S.par.y * focus;
      el.style.transform = `translate3d(calc(-50% + ${(x + px).toFixed(2)}px), calc(-50% + ${py.toFixed(2)}px), ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) scale(${sc.toFixed(4)})`;
      el.style.filter = bl > 0.05 ? `blur(${bl.toFixed(2)}px)` : "none";
      el.style.opacity = op.toFixed(3);
      el.style.zIndex = String(100 - Math.round(ad * 10));
      el.setAttribute("aria-hidden", i === activeIdx ? "false" : "true");
    }
  };

  /* ---------- active change → copy + progress swap ---------- */
  useEffect(() => {
    if (active === shown) return;
    if (reduced) {
      setShown(active);
      return;
    }
    const { gsap: g } = ensureGsap();
    const nodes = swapRefs.current.filter(Boolean) as HTMLDivElement[];
    nodes.forEach((n) => g.killTweensOf(n));
    g.to(nodes, {
      opacity: 0,
      y: -12,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setShown(active);
        g.fromTo(nodes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" });
      },
    });
    barRefs.current.forEach((b, i) => {
      if (!b) return;
      g.killTweensOf(b);
      if (i === active) g.fromTo(b, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power2.out" });
      else g.set(b, { scaleX: 0 });
    });
  }, [active, shown, reduced]);

  /* ---------- boot: measure, ticker, autoplay, drag, keys ---------- */
  useLayoutEffect(() => {
    const isReduced = prefersReducedMotion();
    setReduced(isReduced);
    const stage = stageRef.current;
    if (!stage) return;
    const { gsap: g } = ensureGsap();
    const idx = () => ((Math.round(S.pos) % N) + N) % N;
    const syncActive = () => {
      const a = idx();
      setActive((prev) => (prev === a ? prev : a));
    };

    const measure = () => {
      S.w = stage.clientWidth;
      S.h = stage.clientHeight;
      S.mobile = window.matchMedia("(max-width: 767px)").matches;
      /* centre frame: 56% of stage width (80% mobile) but never taller than
         the stage itself — keeps the whole chain inside one viewport */
      S.slideW = Math.min(S.w * (S.mobile ? 0.8 : 0.56), S.h * 1.5 * 0.86);
      slideRefs.current.forEach((el) => {
        if (el) el.style.width = `${S.slideW.toFixed(1)}px`;
      });
      apply();
    };
    measure();
    window.addEventListener("resize", measure);

    const step = (dir: number) => {
      g.killTweensOf(S);
      g.to(S, {
        pos: S.pos + dir,
        duration: STEP_S,
        ease: "power2.inOut",
        onUpdate: () => {
          apply();
          syncActive();
        },
      });
    };
    const schedule = () => {
      if (S.quiet) S.quiet.kill();
      S.quiet = g.delayedCall(AUTOPLAY_S, () => {
        if (!S.dragging && !document.hidden) step(1);
        schedule();
      });
    };
    const pauseThenResume = () => {
      if (S.quiet) S.quiet.kill();
      S.quiet = g.delayedCall(2.5, () => schedule());
    };

    if (!isReduced) {
      g.ticker.add(apply);
      schedule();
    } else {
      apply();
    }

    /* hover: pause belt, tiny scale, pointer parallax on the active frame */
    const onEnter = () => {
      S.hoverT = 1;
      if (!isReduced) {
        g.killTweensOf(S);
        pauseThenResume();
      }
    };
    const onLeave = () => {
      S.hoverT = 0;
      S.parT = { x: 0, y: 0 };
    };
    const onMove = (e: MouseEvent) => {
      if (isReduced || S.mobile || S.dragging) return;
      const r = stage.getBoundingClientRect();
      S.parT = {
        x: ((e.clientX - r.left) / r.width - 0.5) * 14,
        y: ((e.clientY - r.top) / r.height - 0.5) * 8,
      };
    };
    stage.addEventListener("mouseenter", onEnter);
    stage.addEventListener("mouseleave", onLeave);
    stage.addEventListener("mousemove", onMove);

    /* drag / swipe the whole chain, momentum + snap */
    let startX = 0;
    let startPos = 0;
    let lastX = 0;
    let lastT = 0;
    const pxPerUnit = () => S.slideW * (S.mobile ? 0.7 : 0.98);
    const onDown = (e: PointerEvent) => {
      if (isReduced) return;
      S.dragging = true;
      g.killTweensOf(S);
      if (S.quiet) S.quiet.kill();
      startX = lastX = e.clientX;
      startPos = S.pos;
      lastT = performance.now();
      S.vel = 0;
      stage.setPointerCapture(e.pointerId);
    };
    const onMovePtr = (e: PointerEvent) => {
      if (!S.dragging) return;
      const now = performance.now();
      const dx = e.clientX - lastX;
      S.vel = 0.8 * S.vel + 0.2 * (dx / Math.max(now - lastT, 1));
      lastX = e.clientX;
      lastT = now;
      S.pos = startPos - (e.clientX - startX) / pxPerUnit();
      apply();
      syncActive();
    };
    const onUp = () => {
      if (!S.dragging) return;
      S.dragging = false;
      const momentum = Math.max(-0.55, Math.min(0.55, -S.vel * 0.12));
      g.to(S, {
        pos: Math.round(S.pos + momentum),
        duration: 0.9,
        ease: "power3.out",
        onUpdate: () => {
          apply();
          syncActive();
        },
        onComplete: () => pauseThenResume(),
      });
    };
    stage.addEventListener("pointerdown", onDown);
    stage.addEventListener("pointermove", onMovePtr);
    stage.addEventListener("pointerup", onUp);
    stage.addEventListener("pointercancel", onUp);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (isReduced) {
          S.pos += 1;
          apply();
          syncActive();
        } else {
          step(1);
          pauseThenResume();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (isReduced) {
          S.pos -= 1;
          apply();
          syncActive();
        } else {
          step(-1);
          pauseThenResume();
        }
      }
    };
    stage.addEventListener("keydown", onKey);

    const api = (d: number) => {
      if (isReduced) {
        S.pos += d;
        apply();
        syncActive();
        return;
      }
      step(d);
      pauseThenResume();
    };
    (stage as HTMLDivElement & { __step?: (d: number) => void }).__step = api;

    const onVis = () => {
      if (document.hidden) {
        if (S.quiet) S.quiet.kill();
      } else if (!isReduced) {
        schedule();
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVis);
      stage.removeEventListener("mouseenter", onEnter);
      stage.removeEventListener("mouseleave", onLeave);
      stage.removeEventListener("mousemove", onMove);
      stage.removeEventListener("pointerdown", onDown);
      stage.removeEventListener("pointermove", onMovePtr);
      stage.removeEventListener("pointerup", onUp);
      stage.removeEventListener("pointercancel", onUp);
      stage.removeEventListener("keydown", onKey);
      g.ticker.remove(apply);
      g.killTweensOf(S);
      if (S.quiet) S.quiet.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const step = (d: number) =>
    (stageRef.current as (HTMLDivElement & { __step?: (d: number) => void }) | null)?.__step?.(d);

  return (
    <section
      data-surface="light"
      className="s-light cap-section border-t border-linesoft"
      aria-labelledby="capabilities-heading"
    >
      <div className="mx-auto flex min-h-[100svh] w-full max-w-shell flex-col px-5 pb-6 pt-16 md:px-8 md:pb-8 md:pt-20 lg:px-12">
        <header id="capabilities-heading" className="text-center">
          <RevealLines
            lines={["What We Do"]}
            className="headline text-[clamp(2.5rem,4.8vw,4.25rem)] text-fog"
          />
          <FadeUp delay={0.12} className="mx-auto mt-4 max-w-md md:mt-5 md:max-w-xl">
            <p className="text-sm leading-relaxed text-fog-dim md:text-base">
              From modernizing legacy systems to building AI-powered products, we help
              businesses turn complexity into opportunity.
            </p>
          </FadeUp>
        </header>

        {/* ---------- the rotating chain ---------- */}
        <div
          ref={stageRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="What we do — rotating service visuals"
          tabIndex={0}
          className="relative min-h-[240px] w-full flex-1 overflow-hidden outline-none [perspective:1400px] md:min-h-[300px]"
          style={{ touchAction: "pan-y" }}
        >
          {CAPABILITIES.map((cap, i) => (
            <div
              key={cap.image}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className={cn(
                "absolute left-1/2 top-1/2 aspect-[3/2] w-[80%] overflow-hidden rounded-xl border border-line bg-card",
                "shadow-[0_30px_70px_rgba(15,15,15,0.16)] will-change-transform md:w-[56%]",
                !reduced && "opacity-0"
              )}
            >
              <Image
                src={cap.image}
                alt={cap.alt}
                fill
                sizes="(min-width: 768px) 56vw, 80vw"
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* ---------- service copy, progress, controls ---------- */}
        <div className="mt-5 grid grid-cols-1 items-center gap-6 md:mt-8 md:grid-cols-[1fr_minmax(0,34rem)_1fr] md:gap-10">
          <div
            ref={(el) => {
              swapRefs.current[0] = el;
            }}
            className="flex items-center gap-4"
          >
            <span className="headline text-3xl text-fog md:text-4xl">
              {String(shown + 1).padStart(2, "0")}
            </span>
            <span className="text-xs tracking-tech text-fog-muted">
              / {String(N).padStart(2, "0")}
            </span>
            <span className="flex flex-1 gap-1.5 md:max-w-[140px]">
              {CAPABILITIES.map((c, i) => (
                <span key={c.image} className="h-px flex-1 overflow-hidden bg-line">
                  <span
                    ref={(el) => {
                      barRefs.current[i] = el;
                    }}
                    className="block h-full origin-left bg-fg"
                    style={{ transform: i === 0 ? "scaleX(1)" : "scaleX(0)" }}
                  />
                </span>
              ))}
            </span>
          </div>

          <div
            ref={(el) => {
              swapRefs.current[1] = el;
            }}
            aria-live="polite"
            className="text-center"
          >
            <h3 className="headline text-[clamp(1.6rem,2.6vw,2.2rem)] text-fog">
              {CAPABILITIES[shown].title.join(" ")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-fog-dim md:text-base">
              {CAPABILITIES[shown].blurb}
            </p>
          </div>

          <div className="flex items-center gap-3 md:justify-self-end">
            <span className="label-tech hidden text-fog-muted lg:block">Drag to explore</span>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous service"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-fog-dim transition-colors duration-300 hover:border-fg/40 hover:text-fog"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next service"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-fog-dim transition-colors duration-300 hover:border-fg/40 hover:text-fog"
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
