"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api, timeAgo } from "./ui";

type Me = { id: string; name: string; email: string; role: string; department?: string; permissions: string[] };
type Notif = { id: string; type: string; title: string; message?: string; read: boolean; createdAt: string };

const NAV: ReadonlyArray<{ href: string; label: string; perm: string; dot?: string }> = [
  { href: "/dashboard",   label: "Dashboard",   perm: "leads.view",               dot: "var(--blue)" },
  { href: "/leads",       label: "Leads",       perm: "leads.view" },
  { href: "/employees",   label: "Employees",   perm: "employees.view" },
  { href: "/imports",     label: "Imports",     perm: "leads.import" },
  { href: "/templates",   label: "Templates",   perm: "leads.email.templates.view" },
  { href: "/automations", label: "Automations", perm: "automations.view" },
  { href: "/activities",  label: "Activities",  perm: "activities.view" },
  { href: "/settings",    label: "Settings",    perm: "settings.view" },
];

const INITIALS = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    api<{ data: Me }>("/api/auth/me").then(({ data, status }) => {
      if (status === 401) window.location.replace("/login");
      else if (data) setMe(data.data);
    });
  }, []);

  useEffect(() => { setBellOpen(false); setMobileNav(false); }, [pathname]);

  useEffect(() => {
    if (!me) return;
    const load = () =>
      api<{ data: { items: Notif[] } }>("/api/notifications").then(({ data }) =>
        data ? setNotifs(data.data.items) : null
      );
    load();
    const t = setInterval(load, 45000);
    return () => clearInterval(t);
  }, [me]);

  const unread = notifs.filter((n) => !n.read).length;
  const links = NAV.filter((n) => me && (me.role === "ADMIN" || me.permissions.includes(n.perm)));
  const currentLabel = NAV.find((n) => pathname.startsWith(n.href))?.label || "Dashboard";

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    window.location.replace("/login");
  };

  return (
    <div className="app-shell">
      {/* ================== SIDEBAR ================== */}
      <aside className="sidebar">
        <Link href="/dashboard" className="aynam-logo mx-auto" style={{ height: 40, width: 180 }}>
          <Image src="/brand/logo.png" alt="AYNAM" fill sizes="180px" priority quality={95} />
        </Link>

        <Link
          href="/leads"
          className="btn btn-primary"
          style={{ margin: "4px 4px 0" }}
        >
          + New Lead
        </Link>

        <nav className="mt-4 flex flex-col gap-1 px-1">
          <span className="label-tech px-3 pb-2" style={{ marginTop: 8 }}>Workspace</span>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-item"
              data-active={pathname.startsWith(l.href) ? "true" : "false"}
            >
              <span className="nav-dot" style={l.dot ? { background: l.dot } : undefined} />
              <span>{l.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto px-1">
          <a
            href="https://aynam.in"
            target="_blank"
            rel="noreferrer"
            className="nav-item text-xs"
            style={{ color: "var(--text-3)" }}
          >
            <span className="nav-dot" style={{ background: "var(--text-3)" }} />
            aynam.in ↗
          </a>
          <div
            className="mt-3 flex items-center gap-3 rounded-lg px-3 py-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="avatar">{me ? INITIALS(me.name) : ".."}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{me?.name || "Loading…"}</p>
              <p className="truncate text-[11px] text-muted">
                {me?.role}
                {me?.department ? ` · ${me.department}` : ""}
              </p>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="rounded-md px-2 py-1 text-xs text-dim transition-colors hover:text-white"
              aria-label="Logout"
            >
              ⎋
            </button>
          </div>
        </div>
      </aside>

      {/* ================== MAIN ================== */}
      <div className="main-col">
        {/* Topbar */}
        <header className="topbar">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileNav(true)}
              aria-label="Open menu"
              className="btn btn-ghost h-9 w-9 p-0 lg:hidden"
            >
              ☰
            </button>
            <Link href="/dashboard" className="aynam-logo lg:hidden" style={{ height: 28, width: 120 }}>
              <Image src="/brand/logo.png" alt="AYNAM" fill sizes="120px" quality={95} />
            </Link>
            <div className="hidden lg:block">
              <div className="label-tech">{currentLabel}</div>
              <div className="text-xs text-dim mt-0.5">
                Welcome back{me?.name ? `, ${me.name.split(" ")[0]}` : ""}.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Search…"
              className="input hidden h-9 w-56 md:block"
              style={{ padding: "0 14px" }}
            />

            <button
              onClick={() => setBellOpen((v) => !v)}
              aria-label="Notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                color: "var(--text-2)",
              }}
            >
              <span aria-hidden>◔</span>
              {unread > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                  style={{ background: "var(--blue)", color: "#fff" }}
                >
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {bellOpen && (
              <div
                className="absolute right-6 top-14 z-50 w-80 overflow-hidden"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span className="label-tech">Notifications</span>
                  <span className="text-[10px] text-muted">{unread} unread</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.length === 0 && (
                    <div className="px-4 py-10 text-center text-sm text-muted">All clear.</div>
                  )}
                  {notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={async () => {
                        await api(`/api/notifications/${n.id}/read`, { method: "PATCH" });
                        setNotifs((v) => v.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                      }}
                      className="block w-full px-4 py-3 text-left transition-colors hover:bg-white/5"
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.message && <p className="mt-0.5 text-xs text-dim line-clamp-2">{n.message}</p>}
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">
                        {timeAgo(n.createdAt)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="avatar">{me ? INITIALS(me.name) : ".."}</div>
          </div>
        </header>

        {/* Mobile drawer */}
        {mobileNav && (
          <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileNav(false)}>
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.7)" }} />
            <aside
              className="absolute left-0 top-0 h-full w-72 p-5"
              style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aynam-logo" style={{ height: 36, width: 160 }}>
                <Image src="/brand/logo.png" alt="AYNAM" fill sizes="160px" quality={95} />
              </div>
              <nav className="mt-8 flex flex-col gap-1">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="nav-item"
                    data-active={pathname.startsWith(l.href) ? "true" : "false"}
                  >
                    <span className="nav-dot" />
                    <span>{l.label}</span>
                  </Link>
                ))}
              </nav>
              <button onClick={logout} className="btn btn-ghost mt-8 w-full">Logout →</button>
            </aside>
          </div>
        )}

        {/* Page */}
        <main className="page fade-in">{children}</main>

        <footer
          className="flex flex-wrap items-center justify-between gap-3 px-7 py-4 text-[11px] text-muted"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span>© {new Date().getFullYear()} AYNAM · Internal CRM · Software for a smarter tomorrow.</span>
          <a href="https://aynam.in" target="_blank" rel="noreferrer" className="transition-colors hover:text-white">
            aynam.in ↗
          </a>
        </footer>
      </div>
    </div>
  );
}
