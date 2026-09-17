"use client";

export const API = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------- data ---------------- */
export async function api<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<{ data: T | null; status: number }> {
  const res = await fetch(API + path, { credentials: "include", ...init });
  if (res.status === 401 && typeof window !== "undefined" && !location.pathname.includes("/login")) {
    location.href = "/login";
  }
  const json = (await res.json().catch(() => null)) as T | null;
  return { data: json, status: res.status };
}
export const get = <T,>(p: string) => api<T>(p);
export const post = <T,>(p: string, body?: unknown) =>
  api<T>(p, { method: "POST", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
export const patch = <T,>(p: string, body?: unknown) =>
  api<T>(p, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
export const del = <T,>(p: string) => api<T>(p, { method: "DELETE" });

/* ---------------- primitives ---------------- */
export const Label = ({ children }: { children: ReactNode }) => (
  <span className="label-tech mb-1.5 block text-fog-muted">{children}</span>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full rounded-md border border-line bg-card px-3.5 py-2.5 text-sm text-fog outline-none transition-colors duration-200 placeholder:text-fog-muted/60 focus:border-fg/50",
      props.className
    )}
  />
);
export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className={cn(
      "w-full rounded-md border border-line bg-card px-3 py-2.5 text-sm text-fog outline-none transition-colors duration-200 focus:border-fg/50",
      props.className
    )}
  />
);
export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...props}
    className={cn(
      "w-full rounded-md border border-line bg-card px-3.5 py-2.5 text-sm leading-relaxed text-fog outline-none transition-colors duration-200 focus:border-fg/50",
      props.className
    )}
  />
);
export const Btn = ({ variant = "solid", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "danger" }) => (
  <button
    {...props}
    className={cn(
      "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-medium tracking-wide transition-colors duration-200 disabled:cursor-wait disabled:opacity-60",
      variant === "solid" && "bg-fg text-ink-950 hover:bg-fg/90",
      variant === "ghost" && "border border-line text-fog-dim hover:border-fg/40 hover:text-fog",
      variant === "danger" && "border border-red-400/40 text-red-500 hover:bg-red-500/10",
      className
    )}
  />
);

export const Badge = ({ tone = "neutral", children }: { tone?: string; children: ReactNode }) => {
  const tones: Record<string, string> = {
    neutral: "border-line text-fog-dim",
    NEW: "border-sky-400/40 text-sky-600",
    CONTACTED: "border-amber-400/40 text-amber-600",
    QUALIFIED: "border-violet-400/40 text-violet-600",
    PROPOSAL: "border-indigo-400/40 text-indigo-600",
    NEGOTIATION: "border-teal-400/40 text-teal-600",
    WON: "border-emerald-400/50 text-emerald-600",
    LOST: "border-line text-fog-muted line-through",
    ON_HOLD: "border-line text-fog-muted",
    URGENT: "border-red-400/50 text-red-500",
    HIGH: "border-orange-400/40 text-orange-600",
    MEDIUM: "border-line text-fog-dim",
    LOW: "border-line text-fog-muted",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wider", tones[tone] || tones.neutral)}>
      {children}
    </span>
  );
};

export const EmptyState = ({ title, body, action }: { title: string; body: string; action?: ReactNode }) => (
  <div className="flex flex-col items-center justify-center border border-dashed border-line px-8 py-20 text-center">
    <span className="label-tech text-fog-muted">AYNAM</span>
    <h3 className="headline mt-4 text-xl text-fog">{title}</h3>
    <p className="mt-3 max-w-sm text-sm leading-relaxed text-fog-dim">{body}</p>
    {action ? <div className="mt-7">{action}</div> : null}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-fg/10", className)} />
);

export const Modal = ({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 md:p-10" onClick={onClose}>
      <div
        className={cn("w-full rounded-lg border border-line bg-card shadow-2xl", wide ? "max-w-3xl" : "max-w-lg")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-linesoft px-6 py-4">
          <h3 className="label-tech text-fog">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-sm text-fog-muted transition-colors hover:text-fog">✕</button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
};

export const PageHead = ({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) => (
  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="headline text-[clamp(1.6rem,2.6vw,2.3rem)] text-fog">{title}</h1>
      {sub ? <p className="mt-2 text-sm text-fog-dim">{sub}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
  </div>
);

export const StatCard = ({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) => (
  <div className="border border-line bg-card px-5 py-4">
    <span className="label-tech text-fog-muted">{label}</span>
    <div className="headline mt-2 text-3xl text-fog">{value}</div>
    {sub ? <p className="mt-1 text-xs text-fog-muted">{sub}</p> : null}
  </div>
);

/* ---------------- formatting ---------------- */
export const fmtDT = (d: string | Date | null | undefined): string => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) + ", " + dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
};
export const timeAgo = (d: string | Date): string => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export function usePoll<T>(fn: () => Promise<T | null>, ms = 45000): { data: T | null; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const load = useCallback(() => {
    fn().then(setData);
  }, [fn]);
  useEffect(() => {
    load();
    const t = setInterval(load, ms);
    return () => clearInterval(t);
  }, [load, ms]);
  return { data, reload: load };
}
