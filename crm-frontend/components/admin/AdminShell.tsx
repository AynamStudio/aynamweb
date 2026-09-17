"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { api, timeAgo } from "./ui";

type Me = { id: string; name: string; email: string; role: string; permissions: string[] };
type Notif = { id: string; type: string; title: string; message: string; read: boolean; createdAt: string };

const NAV = [
  { href: "/dashboard", label: "Dashboard", perm: "leads.view" },
  { href: "/leads", label: "Leads", perm: "leads.view" },
  { href: "/employees", label: "Employees", perm: "employees.view" },
  { href: "/imports", label: "Imports", perm: "leads.import" },
  { href: "/templates", label: "Templates", perm: "templates.view" },
  { href: "/automations", label: "Automations", perm: "automations.view" },
  { href: "/activities", label: "Activities", perm: "activity.view" },
  { href: "/settings", label: "Settings", perm: "settings.view" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [dark, setDark] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDark(localStorage.getItem("aynam-admin-theme") === "dark");
    api<{ data: Me }>("/api/auth/me").then(({ data, status }) => {
      if (status === 401) location.href = "/login";
      else if (data) setMe(data.data);
    });
  }, []);
  useEffect(() => {
    localStorage.setItem("aynam-admin-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    if (!me) return;
    const load = () =>
      api<{ data: { items: Notif[] } }>("/api/notifications").then(({ data }) => data && setNotifs(data.data.items));
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [me]);

  const unread = notifs.filter((n) => !n.read).length;
  const links = NAV.filter((n) => me && (me.role === "ADMIN" || me.permissions.includes(n.perm)));

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    location.href = "/login";
  };

  return (
    <div className={cn("min-h-screen", dark ? "s-dark" : "s-light")}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        {/* sidebar */}
        <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-linesoft px-5 py-7 lg:flex">
          <Link href="/dashboard" className="headline text-lg tracking-[0.3em] text-fog">AYNAM</Link>
          <span className="label-tech mt-1 text-fog-muted">Internal System</span>
          <nav className="mt-10 flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition-colors duration-200",
                  pathname.startsWith(l.href) ? "bg-fg/10 font-medium text-fog" : "text-fog-dim hover:bg-fg/5 hover:text-fog"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto border-t border-linesoft pt-4">
            <p className="text-xs text-fog">{me?.name}</p>
            <p className="mt-0.5 text-[11px] text-fog-muted">{me?.role}</p>
            <button onClick={logout} className="label-tech mt-3 text-fog-muted transition-colors hover:text-fog">Logout →</button>
          </div>
        </aside>

        {/* main */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-linesoft bg-inherit px-5 py-3.5 backdrop-blur lg:px-9">
            <div className="flex items-center gap-4 overflow-x-auto">
              <Link href="/dashboard" className="headline shrink-0 text-base tracking-[0.3em] text-fog lg:hidden">AYNAM</Link>
              <nav className="flex items-center gap-1 overflow-x-auto lg:hidden">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors",
                      pathname.startsWith(l.href) ? "bg-fg/10 font-medium text-fog" : "text-fog-dim"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <span className="label-tech hidden text-fog-muted lg:block">
                {NAV.find((n) => pathname.startsWith(n.href))?.label || "Dashboard"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setBellOpen((v) => !v)}
                  aria-label="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line text-fog-dim transition-colors hover:text-fog"
                >
                  ◔
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg px-1 text-[9px] font-bold text-ink-950">
                      {unread}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="absolute right-0 top-11 z-50 w-80 rounded-lg border border-line bg-card shadow-xl">
                    <div className="border-b border-linesoft px-4 py-3">
                      <span className="label-tech text-fog">Notifications</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 && <p className="px-4 py-6 text-sm text-fog-muted">Nothing yet.</p>}
                      {notifs.map((n) => (
                        <button
                          key={n.id}
                          onClick={async () => {
                            await api(`/api/notifications/${n.id}/read`, { method: "PATCH" });
                            setNotifs((v) => v.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                          }}
                          className={cn("block w-full border-b border-linesoft px-4 py-3 text-left transition-colors hover:bg-fg/5", !n.read && "bg-fg/[0.04]")}
                        >
                          <p className="text-sm text-fog">{n.title}</p>
                          {n.message && <p className="mt-0.5 text-xs text-fog-dim">{n.message}</p>}
                          <p className="mt-1 text-[10px] text-fog-muted">{timeAgo(n.createdAt)}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setDark((v) => !v)}
                aria-label="Toggle theme"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-fog-dim transition-colors hover:text-fog"
              >
                {dark ? "○" : "●"}
              </button>
              <span className="label-tech hidden text-fog-muted md:block">{me?.name}</span>
            </div>
          </header>
          <main className="px-5 py-8 lg:px-9 lg:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
