"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell from "@/components/admin/AdminShell";
import { API, Badge, Btn, EmptyState, fmtDT, get, Input, patch, post, Select, Skeleton } from "@/components/admin/ui";

type LeadRow = {
  id: string; name: string; email: string; company: string; projectType: string;
  status: string; priority: string; source: string;
  assignedTo: { id: string; name: string } | null;
  lastContactedAt: string | null; nextFollowUpAt: string | null; createdAt: string;
};
type Emp = { id: string; name: string; role: string };

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ON_HOLD"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function LeadsPage() {
  const [rows, setRows] = useState<LeadRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [source, setSource] = useState("");
  const [assigned, setAssigned] = useState("");
  const [sort, setSort] = useState("newest");
  const [sel, setSel] = useState<string[]>([]);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const p = new URLSearchParams({ page: String(page), limit: "20", sort });
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (priority) p.set("priority", priority);
    if (source) p.set("source", source);
    if (assigned) p.set("assigned", assigned);
    get<{ data: { items: LeadRow[]; total: number; pages: number } }>(`/api/leads?${p}`).then(({ data }) => {
      if (data) {
        setRows(data.data.items);
        setTotal(data.data.total);
        setPages(data.data.pages);
      }
    });
  }, [page, q, status, priority, source, assigned, sort]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0); // debounced search
    return () => clearTimeout(t);
  }, [load, q]);
  useEffect(() => {
    get<{ data: { items: Emp[] } }>("/api/employees").then(({ data }) => data && setEmps(data.data.items));
  }, []);

  const bulk = async (action: "assign" | "status" | "priority" | "tag", value: string) => {
    if (!sel.length) return;
    setBusy(true);
    await patch("/api/leads/bulk", { ids: sel, action, value });
    setSel([]);
    setBusy(false);
    load();
  };

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="headline text-[clamp(1.6rem,2.6vw,2.3rem)] text-fog">Leads</h1>
          <p className="mt-2 text-sm text-fog-dim">{total} record{total === 1 ? "" : "s"} · server-side search & filters</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`${API}/api/leads/export?format=csv`} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-xs text-fog-dim transition-colors hover:text-fog">Export CSV</a>
          <a href={`${API}/api/leads/export?format=xlsx`} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-xs text-fog-dim transition-colors hover:text-fog">Export Excel</a>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-6">
        <Input placeholder="Search name, email, company…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="col-span-2" />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }}>
          <option value="">All priorities</option>
          {PRIORITIES.map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}>
          <option value="">All sources</option>
          {["WEBSITE", "CSV_IMPORT", "EXCEL_IMPORT", "MANUAL"].map((s) => <option key={s}>{s}</option>)}
        </Select>
        <Select value={assigned} onChange={(e) => { setAssigned(e.target.value); setPage(1); }}>
          <option value="">Anyone</option>
          <option value="unassigned">Unassigned</option>
          <option value="me">Assigned to me</option>
          {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </div>

      {sel.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 border border-line bg-card px-4 py-3">
          <span className="text-xs text-fog-dim">{sel.length} selected</span>
          <Select className="!w-40" defaultValue="" onChange={(e) => { if (e.target.value) bulk("status", e.target.value); e.target.value = ""; }}>
            <option value="">Set status…</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select className="!w-40" defaultValue="" onChange={(e) => { if (e.target.value) bulk("priority", e.target.value); e.target.value = ""; }}>
            <option value="">Set priority…</option>
            {PRIORITIES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Select className="!w-44" defaultValue="" onChange={(e) => { if (e.target.value) bulk("assign", e.target.value); e.target.value = ""; }}>
            <option value="">Assign to…</option>
            {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Btn variant="ghost" disabled={busy} onClick={() => bulk("tag", "bulk-touched")}>Add tag</Btn>
          <Btn variant="ghost" onClick={() => setSel([])}>Clear</Btn>
        </div>
      )}

      {!rows ? (
        <div className="space-y-2">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No leads yet." body="Website enquiries will appear here. You can also import an existing list from the Imports page." action={<Link href="/imports" className="text-xs text-fog-dim underline underline-offset-4">Import leads →</Link>} />
      ) : (
        <>
          {/* desktop table */}
          <div className="hidden overflow-x-auto border border-line bg-card lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-linesoft">
                  <th className="px-4 py-3"><input type="checkbox" aria-label="Select all" checked={sel.length === rows.length} onChange={(e) => setSel(e.target.checked ? rows.map((r) => r.id) : [])} /></th>
                  {["Name", "Company", "Project", "Status", "Priority", "Assigned To", "Source", "Next Follow-up", "Created"].map((h) => (
                    <th key={h} className="label-tech whitespace-nowrap px-4 py-3 font-normal text-fog-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-linesoft transition-colors last:border-0 hover:bg-fg/5">
                    <td className="px-4 py-3"><input type="checkbox" aria-label={`Select ${r.name}`} checked={sel.includes(r.id)} onChange={(e) => setSel(e.target.checked ? [...sel, r.id] : sel.filter((x) => x !== r.id))} /></td>
                    <td className="px-4 py-3"><Link href={`/leads/${r.id}`} className="text-fog hover:underline">{r.name}</Link><p className="text-xs text-fog-muted">{r.email}</p></td>
                    <td className="px-4 py-3 text-fog-dim">{r.company || "—"}</td>
                    <td className="px-4 py-3 text-fog-dim">{r.projectType || "—"}</td>
                    <td className="px-4 py-3"><Badge tone={r.status}>{r.status}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={r.priority}>{r.priority}</Badge></td>
                    <td className="px-4 py-3 text-fog-dim">{r.assignedTo?.name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-fog-muted">{r.source}</td>
                    <td className="px-4 py-3 text-xs text-fog-dim">{fmtDT(r.nextFollowUpAt)}</td>
                    <td className="px-4 py-3 text-xs text-fog-muted">{fmtDT(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* mobile cards */}
          <div className="space-y-3 lg:hidden">
            {rows.map((r) => (
              <Link key={r.id} href={`/leads/${r.id}`} className="block border border-line bg-card px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-fog">{r.name}</p>
                  <Badge tone={r.status}>{r.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-fog-muted">{r.company || r.email}</p>
                <div className="mt-2 flex items-center gap-2 text-[11px] text-fog-muted">
                  <Badge tone={r.priority}>{r.priority}</Badge>
                  <span>{r.assignedTo?.name || "Unassigned"}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs text-fog-muted">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <Btn variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</Btn>
              <Btn variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</Btn>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}
