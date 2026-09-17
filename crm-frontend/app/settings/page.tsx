"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Btn, get, Input, Label, patch, Select, Skeleton } from "@/components/admin/ui";

type Settings = { businessName: string; websiteUrl: string; contactEmail: string; defaultLeadStatus: string; defaultLeadPriority: string; timezone: string };

export default function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { get<{ data: Settings }>("/api/settings").then(({ data }) => data && setS(data.data)); }, []);
  return (
    <AdminShell>
      <h1 className="headline mb-2 text-[clamp(1.6rem,2.6vw,2.3rem)] text-fog">Settings</h1>
      <p className="mb-8 text-sm text-fog-dim">Business defaults. SMTP secrets stay in environment variables — never here.</p>
      {!s ? <Skeleton className="h-72" /> : (
        <div className="max-w-xl space-y-5 border border-line bg-card px-6 py-7">
          <div><Label>Business name</Label><Input value={s.businessName} onChange={(e) => setS({ ...s, businessName: e.target.value })} /></div>
          <div><Label>Website URL</Label><Input value={s.websiteUrl} onChange={(e) => setS({ ...s, websiteUrl: e.target.value })} placeholder="https://…" /></div>
          <div><Label>Contact email</Label><Input value={s.contactEmail} onChange={(e) => setS({ ...s, contactEmail: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Default lead status</Label><Select value={s.defaultLeadStatus} onChange={(e) => setS({ ...s, defaultLeadStatus: e.target.value })}>{["NEW", "CONTACTED", "QUALIFIED"].map((x) => <option key={x}>{x}</option>)}</Select></div>
            <div><Label>Default priority</Label><Select value={s.defaultLeadPriority} onChange={(e) => setS({ ...s, defaultLeadPriority: e.target.value })}>{["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => <option key={x}>{x}</option>)}</Select></div>
          </div>
          <div><Label>Timezone</Label><Input value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} /></div>
          <Btn onClick={async () => { await patch("/api/settings", s); setSaved(true); setTimeout(() => setSaved(false), 2000); }}>{saved ? "Saved ✓" : "Save changes"}</Btn>
        </div>
      )}
    </AdminShell>
  );
}
