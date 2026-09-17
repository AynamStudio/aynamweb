"use client";

import { useEffect, useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { API, Badge, Btn, fmtDT, get, Label, post, Select, Skeleton } from "@/components/admin/ui";

type Preview = { jobId: string; fileName: string; columns: string[]; rowCount: number; suggestedMapping: Record<string, string>; preview: Record<string, string>[] };
type Result = { totalRows: number; created: number; updated: number; skipped: number; duplicates: number; invalid: number; errors: { row: number; field: string; message: string }[] };
type Job = { id: string; fileName: string; source: string; uploadedBy: string; totalRows: number; successfulRows: number; failedRows: number; duplicateRows: number; status: string; createdAt: string };

const FIELDS = ["name", "email", "phone", "company", "projectType", "budget", "message", "status", "priority", "tags"];

export default function ImportsPage() {
  const [step, setStep] = useState<"idle" | "preview" | "result">("idle");
  const [prev, setPrev] = useState<Preview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [policy, setPolicy] = useState<"skip" | "update" | "create">("skip");
  const [result, setResult] = useState<Result | null>(null);
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadJobs = () => get<{ data: { items: Job[] } }>("/api/imports").then(({ data }) => data && setJobs(data.data.items));
  useEffect(() => { loadJobs(); }, []);

  const upload = async (file: File) => {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(API + "/api/imports", { method: "POST", body: fd, credentials: "include" });
    const json = (await res.json()) as { data?: Preview; error?: string };
    setBusy(false);
    if (json.data) {
      setPrev(json.data);
      setMapping(json.data.suggestedMapping);
      setStep("preview");
    } else if (json.error) {
      alert(json.error);
    }
  };

  const commit = async () => {
    if (!prev) return;
    setBusy(true);
    const { data } = await post<{ data: Result }>(`/api/imports/${prev.jobId}/commit`, { jobId: prev.jobId, mapping, duplicatePolicy: policy });
    setBusy(false);
    if (data) {
      setResult(data.data);
      setStep("result");
      loadJobs();
    }
  };

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="headline text-[clamp(1.6rem,2.6vw,2.3rem)] text-fog">Imports</h1>
          <p className="mt-2 text-sm text-fog-dim">CSV & Excel lead imports with preview, mapping and validation.</p>
        </div>
        <div className="flex gap-2">
          <a href={`${API}/api/imports/template?format=csv`} className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-xs text-fog-dim hover:text-fog">CSV template</a>
          <a href={`${API}/api/imports/template?format=xlsx`} className="inline-flex items-center rounded-full border border-line px-5 py-2.5 text-xs text-fog-dim hover:text-fog">Excel template</a>
        </div>
      </div>

      {step === "idle" && (
        <div
          className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-line px-8 py-16 text-center transition-colors hover:border-fg/40"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
        >
          <span className="label-tech text-fog-muted">Step 1 — Upload</span>
          <p className="mt-4 text-sm text-fog-dim">Drop a .csv, .xlsx or .xls file here, or click to browse.</p>
          <p className="mt-2 text-xs text-fog-muted">Nothing is imported until you review and confirm.</p>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
          {busy && <p className="mt-4 text-xs text-fog">Reading file…</p>}
        </div>
      )}

      {step === "preview" && prev && (
        <div className="space-y-8">
          <div className="border border-line bg-card px-6 py-5">
            <p className="text-sm text-fog">{prev.fileName} · {prev.rowCount} rows · {prev.columns.length} columns</p>
            <p className="mt-1 text-xs text-fog-muted">Step 2 — Map columns. Suggestions are pre-filled; verify before importing.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FIELDS.map((f) => (
              <div key={f}>
                <Label>AYNAM field: {f}{f === "email" ? " *" : ""}</Label>
                <Select value={mapping[f] || ""} onChange={(e) => setMapping({ ...mapping, [f]: e.target.value })}>
                  <option value="">— not imported —</option>
                  {prev.columns.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </div>
            ))}
          </div>
          <div>
            <Label>Preview (first rows)</Label>
            <div className="overflow-x-auto border border-line bg-card">
              <table className="w-full text-left text-xs">
                <thead><tr className="border-b border-linesoft">{prev.columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-2 text-fog-muted">{c}</th>)}</tr></thead>
                <tbody>{prev.preview.slice(0, 8).map((r, i) => (
                  <tr key={i} className="border-b border-linesoft last:border-0">{prev.columns.map((c) => <td key={c} className="max-w-[220px] truncate px-3 py-2 text-fog-dim">{r[c]}</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label>Duplicates (matching email)</Label>
              <Select value={policy} onChange={(e) => setPolicy(e.target.value as typeof policy)}>
                <option value="skip">Skip duplicates</option>
                <option value="update">Update existing lead</option>
                <option value="create">Create anyway</option>
              </Select>
            </div>
            <Btn variant="ghost" onClick={() => setStep("idle")}>Cancel</Btn>
            <Btn disabled={busy || !mapping.email} onClick={commit}>{busy ? "Importing…" : "Validate & import →"}</Btn>
            {!mapping.email && <span className="text-xs text-fog-muted">Map the email column to continue.</span>}
          </div>
        </div>
      )}

      {step === "result" && result && (
        <div className="space-y-6">
          <div className="border border-line bg-card px-8 py-10 text-center">
            <span className="label-tech text-fog-muted">Import complete</span>
            <h2 className="headline mt-3 text-2xl text-fog">{result.totalRows.toLocaleString()} rows processed</h2>
            <p className="mt-3 text-sm text-fog-dim">
              {result.created} created · {result.updated} updated · {result.duplicates} duplicates · {result.invalid} invalid
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <Btn variant="ghost" onClick={() => { setStep("idle"); setPrev(null); setResult(null); }}>Import another</Btn>
              <a href="/leads" className="inline-flex items-center rounded-full bg-fg px-6 py-2.5 text-xs font-medium text-ink-950">View leads →</a>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div>
              <Label>Row errors (first {result.errors.length})</Label>
              <div className="max-h-72 overflow-y-auto border border-line bg-card">
                <table className="w-full text-left text-xs">
                  <thead><tr className="border-b border-linesoft"><th className="px-3 py-2 text-fog-muted">Row</th><th className="px-3 py-2 text-fog-muted">Field</th><th className="px-3 py-2 text-fog-muted">Issue</th></tr></thead>
                  <tbody>{result.errors.map((e, i) => (
                    <tr key={i} className="border-b border-linesoft last:border-0"><td className="px-3 py-2 text-fog-dim">{e.row}</td><td className="px-3 py-2 text-fog-dim">{e.field}</td><td className="px-3 py-2 text-fog-dim">{e.message}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-12">
        <h2 className="label-tech mb-4 text-fog-muted">Import history</h2>
        {!jobs ? <Skeleton className="h-32" /> : jobs.length === 0 ? (
          <p className="border border-dashed border-line px-6 py-10 text-center text-sm text-fog-muted">No imports yet.</p>
        ) : (
          <div className="overflow-x-auto border border-line bg-card">
            <table className="w-full text-left text-sm">
              <thead><tr className="border-b border-linesoft">{["File", "Source", "Uploaded by", "Rows", "Created", "Failed", "Duplicates", "Status", "When"].map((h) => <th key={h} className="label-tech px-4 py-3 font-normal text-fog-muted">{h}</th>)}</tr></thead>
              <tbody>{jobs.map((j) => (
                <tr key={j.id} className="border-b border-linesoft last:border-0">
                  <td className="px-4 py-3 text-fog">{j.fileName}</td>
                  <td className="px-4 py-3 text-xs text-fog-muted">{j.source}</td>
                  <td className="px-4 py-3 text-fog-dim">{j.uploadedBy}</td>
                  <td className="px-4 py-3 text-fog-dim">{j.totalRows}</td>
                  <td className="px-4 py-3 text-fog-dim">{j.successfulRows}</td>
                  <td className="px-4 py-3 text-fog-dim">{j.failedRows}</td>
                  <td className="px-4 py-3 text-fog-dim">{j.duplicateRows}</td>
                  <td className="px-4 py-3"><Badge tone={j.status === "COMPLETED" ? "WON" : j.status === "FAILED" ? "LOST" : "CONTACTED"}>{j.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-fog-muted">{fmtDT(j.createdAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
