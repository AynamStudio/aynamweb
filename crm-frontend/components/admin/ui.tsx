"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ---------------- API client ----------------
 * Browser calls same-origin /api/*; Next.js rewrites (see next.config.ts)
 * forward to the backend configured via the server-only API_URL env var.
 * No NEXT_PUBLIC_* env is needed client-side.
 */
export const API = "";

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

/* ---------------- Primitives ---------------- */
export const Label = ({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) => (
  <label htmlFor={htmlFor} className={cn("label-tech mb-1.5 block", className)}>{children}</label>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={cn("input", props.className)} />
);
export const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={cn("input appearance-none pr-8", props.className)} />
);
export const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={cn("input resize-y leading-relaxed", props.className)} />
);

export const Btn = ({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) => (
  <button
    {...props}
    className={cn(
      "btn",
      variant === "primary" && "btn-primary",
      variant === "ghost" && "btn-ghost",
      variant === "danger" && "btn-danger",
      className
    )}
  />
);

const toneMap: Record<string, string> = {
  NEW: "badge-new",
  WON: "badge-won",
  LOST: "badge-lost",
  URGENT: "badge-urgent",
  HIGH: "badge-pending",
  CONTACTED: "badge-pending",
  QUALIFIED: "badge-accent",
  PROPOSAL: "badge-accent",
  NEGOTIATION: "badge-pending",
};
export const Badge = ({ tone, children }: { tone?: string; children: ReactNode }) => (
  <span className={cn("badge", tone ? toneMap[tone] || "" : "")}>{children}</span>
);

export const EmptyState = ({ title, body, action }: { title: string; body: string; action?: ReactNode }) => (
  <div className="empty">
    <span className="label-tech">AYNAM</span>
    <h3>{title}</h3>
    <p>{body}</p>
    {action ? <div className="mt-6">{action}</div> : null}
  </div>
);

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("skeleton", className)} />
);

export const Modal = ({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={cn("modal", wide ? "max-w-3xl" : "max-w-lg")} onClick={(e) => e.stopPropagation()}>
        <header>
          <h3 className="text-sm font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-muted transition-colors hover:text-white">✕</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export const PageHead = ({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) => (
  <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div>
      <h1 className="headline text-[clamp(1.6rem,2.6vw,2.25rem)]">{title}</h1>
      {sub ? <p className="mt-2 text-sm text-dim">{sub}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </div>
);

export const StatCard = ({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: string; accent?: boolean }) => (
  <div className="kpi">
    <div className="kpi-label">{label}</div>
    <div className="kpi-value" style={accent ? { color: "var(--blue)" } : undefined}>{value}</div>
    {sub ? <div className="kpi-sub">{sub}</div> : null}
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
  const load = useCallback(() => { fn().then(setData); }, [fn]);
  useEffect(() => { load(); const t = setInterval(load, ms); return () => clearInterval(t); }, [load, ms]);
  return { data, reload: load };
}
