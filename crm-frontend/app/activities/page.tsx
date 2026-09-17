"use client";

import AdminShell from "@/components/admin/AdminShell";
import { fmtDT, get, Skeleton, usePoll } from "@/components/admin/ui";

type Act = { id: string; leadId: string | null; type: string; description: string; actor: string; createdAt: string };

export default function ActivitiesPage() {
  const { data } = usePoll(async () => {
    const { data } = await get<{ data: { items: Act[] } }>("/api/activities?limit=80");
    return data ? data.data.items : null;
  }, 40000);
  return (
    <AdminShell>
      <h1 className="headline mb-8 text-[clamp(1.6rem,2.6vw,2.3rem)] text-fog">Activities</h1>
      {!data ? <Skeleton className="h-96" /> : data.length === 0 ? (
        <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-fog-muted">No activity yet. Lead changes will be recorded here.</p>
      ) : (
        <div className="border border-line bg-card px-6 py-4">
          {data.map((a, i) => (
            <div key={a.id} className="relative flex gap-4 py-3">
              <div className="flex flex-col items-center">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fg/60" />
                {i < data.length - 1 && <span className="w-px flex-1 bg-line" />}
              </div>
              <div>
                <p className="text-sm text-fog-dim">{a.description}</p>
                <p className="mt-0.5 text-[11px] text-fog-muted">{a.actor} · {fmtDT(a.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
