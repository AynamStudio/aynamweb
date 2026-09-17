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
      <PageHead title="AYNAM Overview" sub="Live pipeline from your website, imports and team activity." />
      {!data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : data.totals.all === 0 ? (
        <EmptyState
          title="Welcome to AYNAM."
          body="Your workspace is ready. No leads yet — once your website receives enquiries, they'll appear here."
          action={<Link href="/imports" className="text-xs text-fog-dim underline underline-offset-4">or import an existing list →</Link>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard label="New Today" value={data.totals.today} />
            <StatCard label="Total Leads" value={data.totals.all} />
            <StatCard label="Unassigned" value={data.totals.unassigned} />
            <StatCard label="Follow-ups Due" value={data.totals.followupsDue} />
            <StatCard label="Won" value={data.totals.byStatus.WON || 0} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(data.totals.byStatus).map(([s, c]) => (
              <Badge key={s} tone={s}>{s} · {c as number}</Badge>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="label-tech mb-4 text-fog-muted">Recent Leads</h2>
              <div className="border border-line bg-card">
                {data.recentLeads.map((l) => (
                  <Link key={l.id} href={`/leads/${l.id}`} className="flex items-center justify-between gap-4 border-b border-linesoft px-5 py-3.5 transition-colors last:border-0 hover:bg-fg/5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-fog">{l.name}</p>
                      <p className="truncate text-xs text-fog-muted">{l.company || l.source} · {timeAgo(l.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={l.priority}>{l.priority}</Badge>
                      <Badge tone={l.status}>{l.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h2 className="label-tech mb-4 text-fog-muted">Recent Activity</h2>
              <div className="border border-line bg-card px-5 py-4">
                {data.recentActivity.length === 0 && <p className="text-sm text-fog-muted">No activity yet.</p>}
                {data.recentActivity.map((a) => (
                  <div key={a.id} className="border-b border-linesoft py-2.5 last:border-0">
                    <p className="text-xs leading-relaxed text-fog-dim">{a.description}</p>
                    <p className="mt-1 text-[10px] text-fog-muted">{a.actor} · {fmtDT(a.createdAt)}</p>
                  </div>
                ))}
              </div>
              <h2 className="label-tech mb-3 mt-8 text-fog-muted">Lead Sources</h2>
              <div className="border border-line bg-card px-5 py-4">
                {Object.entries(data.sources).map(([s, c]) => (
                  <div key={s} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-fog-dim">{s}</span>
                    <span className="headline text-fog">{c as number}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
