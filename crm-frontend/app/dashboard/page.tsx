"use client";

import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { Badge, EmptyState, fmtDT, get, PageHead, Skeleton, StatCard, timeAgo, usePoll } from "@/components/admin/ui";

type Stats = {
  totals: { all: number; today: number; unassigned: number; followupsDue: number; byStatus: Record<string, number> };
  sources: Record<string, number>;
  recentLeads: { id: string; name: string; company: string; status: string; priority: string; source: string; createdAt: string; assignedTo: string | null }[];
  recentActivity: { id: string; description: string; actor: string; createdAt: string }[];
};

export default function DashboardPage() {
  const { data } = usePoll(async () => {
    const { data } = await get<{ data: Stats }>("/api/dashboard/stats");
    return data ? data.data : null;
  }, 40000);

  return (
    <AdminShell>
      <PageHead
        title="Overview"
        sub="Live pipeline from aynam.in, imports and team activity."
        actions={
          <Link href="/leads" className="btn btn-primary">+ New Lead</Link>
        }
      />

      {!data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : data.totals.all === 0 ? (
        <EmptyState
          title="Welcome to AYNAM."
          body="Your workspace is ready. No leads yet — once aynam.in receives enquiries, they'll appear here."
          action={<Link href="/imports" className="btn btn-ghost">Import a list →</Link>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="New Today"        value={data.totals.today} accent />
            <StatCard label="Total Leads"      value={data.totals.all} />
            <StatCard label="Unassigned"       value={data.totals.unassigned} />
            <StatCard label="Follow-ups Due"   value={data.totals.followupsDue} />
            <StatCard label="Won"              value={data.totals.byStatus.WON || 0} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(data.totals.byStatus).map(([s, c]) => (
              <Badge key={s} tone={s}>{s} · {c as number}</Badge>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent leads */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="label-tech">Recent Leads</h2>
                <Link href="/leads" className="text-xs text-dim transition-colors hover:text-white">View all →</Link>
              </div>
              <div className="panel overflow-hidden">
                {data.recentLeads.map((l) => (
                  <Link
                    key={l.id}
                    href={`/leads/${l.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors last:border-0"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{l.name}</p>
                      <p className="truncate text-xs text-muted">{l.company || l.source} · {timeAgo(l.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={l.priority}>{l.priority}</Badge>
                      <Badge tone={l.status}>{l.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Side column */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="label-tech mb-3">Recent Activity</h2>
                <div className="panel px-5 py-4">
                  {data.recentActivity.length === 0 && <p className="text-sm text-muted">No activity yet.</p>}
                  {data.recentActivity.map((a) => (
                    <div key={a.id} className="py-2.5 last:border-0" style={{ borderBottom: "1px solid var(--border)" }}>
                      <p className="text-xs leading-relaxed text-dim">{a.description}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">{a.actor} · {fmtDT(a.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="label-tech mb-3">Lead Sources</h2>
                <div className="panel px-5 py-4">
                  {Object.entries(data.sources).map(([s, c]) => (
                    <div key={s} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-dim">{s}</span>
                      <span className="text-base font-semibold">{c as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
