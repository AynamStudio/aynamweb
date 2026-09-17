"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TransitionLink from "@/components/motion/TransitionLink";
import { NAV_LINKS } from "@/lib/constants";
import { useNavSurface } from "@/lib/useNavSurface";
import { cn } from "@/lib/utils";
import MobileMenu from "./MobileMenu";

/**
 * Fixed editorial navigation: logo left, links centred, CTA right.
 * Colours adapt to the section surface beneath the bar with a slow
 * cross-fade (white on dark sections, ink on light sections).
 */
export default function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const tone = useNavSurface();
  const light = tone === "light" && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        data-nav={open ? "dark" : tone}
        className={cn(
          "fixed inset-x-0 top-0 z-[60] transition-colors duration-500",
          scrolled || open
            ? open
              ? "border-b border-transparent bg-transparent"
              : light
                ? "border-b border-[rgba(0,0,0,0.08)] bg-[rgba(245,245,242,0.82)] backdrop-blur-md"
                : "border-b border-linesoft bg-[rgba(7,7,7,0.78)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent"
        )}
      >
        <nav
          aria-label="Main"
          className="mx-auto grid h-[60px] w-full max-w-shell grid-cols-[1fr_auto] items-center px-5 md:h-[72px] md:grid-cols-[1fr_auto_1fr] md:px-8 lg:px-12"
        >
          {/* logo — left */}
          <TransitionLink
            href="/"
            aria-label="AYNAM — home"
            className="group inline-flex items-center py-2"
          >
            <span className="grid">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-lockup.png"
                alt="AYNAM"
                className="nav-logo nav-logo--white h-[15px] w-auto opacity-95 transition-opacity duration-300 group-hover:opacity-70 md:h-[17px]"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-lockup-dark.png"
                alt=""
                aria-hidden="true"
                className="nav-logo nav-logo--dark h-[15px] w-auto opacity-95 transition-opacity duration-300 group-hover:opacity-70 md:h-[17px]"
              />
            </span>
          </TransitionLink>

          {/* links — centred */}
          <div className="hidden items-center gap-8 md:flex" data-purpose="nav-links">
            {NAV_LINKS.map((link) => {
              const href: string = link.href;
              const path = href.split("#")[0];
              const active =
                href === pathname || (path !== "/" && path !== "" && pathname.startsWith(path));
              return (
                <TransitionLink
                  key={link.label}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-xs tracking-[0.06em] transition-colors duration-500",
                    light
                      ? active
                        ? "text-[#0a0a0a] hover:text-[#0a0a0a]"
                        : "text-[#5e5e5e] hover:text-[#0a0a0a]"
                      : active
                        ? "text-fog hover:text-fog"
                        : "text-fog-dim hover:text-fog"
                  )}
                >
                  {link.label}
                </TransitionLink>
              );
            })}
          </div>

          {/* CTA — right */}
          <div className="flex items-center justify-end gap-3">
            <TransitionLink
              href="/contact"
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs tracking-[0.04em] transition-all duration-500 sm:inline-flex",
                light
                  ? "border-[rgba(0,0,0,0.28)] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-[#f5f5f5]"
                  : "border-fg/20 text-fog hover:bg-fg hover:text-ink-950"
              )}
            >
              Let&apos;s Build <span aria-hidden="true">→</span>
            </TransitionLink>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 flex-col items-center justify-center gap-[6px] md:hidden"
            >
              <span
                className={cn(
                  "block h-px w-6 transition-all duration-300",
                  light ? "bg-[#0a0a0a]" : "bg-fog",
                  open && "translate-y-[3.5px] rotate-45 bg-fog"
                )}
              />
              <span
                className={cn(
                  "block h-px w-6 transition-all duration-300",
                  light ? "bg-[#0a0a0a]" : "bg-fog",
                  open && "-translate-y-[3.5px] -rotate-45 bg-fog"
                )}
              />
            </button>
          </div>
        </nav>
      </header>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </>
  );
}
