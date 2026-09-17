"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { Badge, Btn, fmtDT, get, Input, Label, Modal, patch, post, Select, Skeleton, Textarea, del } from "@/components/admin/ui";

type Lead = {
  id: string; name: string; email: string; phone: string; company: string; projectType: string; budget: string; message: string;
  source: string; status: string; priority: string; tags: string[];
  assignedTo: { id: string; name: string } | null;
  nextFollowUpAt: string | null; lastContactedAt: string | null;
  emailStatus: { admin?: string; user?: string } | null;
  createdAt: string;
  notes: { id: string; body: string; author: string; createdAt: string }[];
  activities: { id: string; type: string; description: string; actor: string; createdAt: string }[];
  emails: { id: string; recipient: string; subject: string; type: string; status: string; sentAt: string }[];
};
type Emp = { id: string; name: string };
type Tpl = { id: string; name: string; subject: string };

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ON_HOLD"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [emps, setEmps] = useState<Emp[]>([]);
  const [tpls, setTpls] = useState<Tpl[]>([]);
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");
  const [mailOpen, setMailOpen] = useState(false);
  const [mail, setMail] = useState({ subject: "", message: "", templateId: "" });
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState("");

  const load = useCallback(() => {
    get<{ data: Lead }>(`/api/leads/${id}`).then(({ data }) => data && setLead(data.data));
  }, [id]);
  useEffect(() => {
    load();
    get<{ data: { items: Emp[] } }>("/api/employees").then(({ data }) => data && setEmps(data.data.items));
    get<{ data: { items: Tpl[] } }>("/api/templates").then(({ data }) => data && setTpls(data.data.items));
  }, [load]);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    await fn();
    setFlash(msg);
    setTimeout(() => setFlash(""), 2500);
    load();
  };

  if (!lead) return <AdminShell><div className="space-y-3"><Skeleton className="h-10 w-64" /><Skeleton className="h-64" /></div></AdminShell>;

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="headline text-[clamp(1.5rem,2.4vw,2.1rem)] text-fog">{lead.name}</h1>
            <Badge tone={lead.status}>{lead.status}</Badge>
            <Badge tone={lead.priority}>{lead.priority}</Badge>
          </div>
          <p className="mt-2 text-sm text-fog-dim">{lead.email}{lead.company ? ` · ${lead.company}` : ""} · via {lead.source} · {fmtDT(lead.createdAt)}</p>
          {lead.emailStatus && (
            <p className="mt-1 text-[11px] text-fog-muted">
              Email delivery — admin notification: {lead.emailStatus.admin || "—"} · confirmation: {lead.emailStatus.user || "—"}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="ghost" onClick={() => setMailOpen(true)}>Send Email →</Btn>
          <Btn variant="danger" onClick={async () => { if (confirm("Delete this lead? The deletion is recorded in the audit log.")) { await del(`/api/leads/${lead.id}`); location.href = "/leads"; } }}>Delete</Btn>
        </div>
      </div>
      {flash && <p className="mb-4 border border-line bg-card px-4 py-2 text-xs text-fog-dim">{flash}</p>}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="border border-line bg-card px-6 py-6">
            <h2 className="label-tech mb-4 text-fog-muted">Project requirements</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div><span className="text-fog-muted">Project</span><p className="mt-1 text-fog">{lead.projectType || "—"}</p></div>
              <div><span className="text-fog-muted">Budget</span><p className="mt-1 text-fog">{lead.budget || "—"}</p></div>
              <div><span className="text-fog-muted">Phone</span><p className="mt-1 text-fog">{lead.phone || "—"}</p></div>
              <div><span className="text-fog-muted">Last contacted</span><p className="mt-1 text-fog">{fmtDT(lead.lastContactedAt)}</p></div>
              <div className="col-span-2"><span className="text-fog-muted">Message</span><p className="mt-1 whitespace-pre-wrap leading-relaxed text-fog-dim">{lead.message || "—"}</p></div>
            </div>
          </section>

          <section className="border border-line bg-card px-6 py-6">
            <h2 className="label-tech mb-4 text-fog-muted">Internal notes</h2>
            <div className="space-y-4">
              {lead.notes.length === 0 && <p className="text-sm text-fog-muted">No notes yet. Notes stay internal — they never appear in customer emails.</p>}
              {lead.notes.map((n) => (
                <div key={n.id} className="border-l border-line pl-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-fog-dim">{n.body}</p>
                  <p className="mt-1 text-[11px] text-fog-muted">{n.author} · {fmtDT(n.createdAt)}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-end gap-3">
              <Textarea rows={2} placeholder="Add an internal note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <Btn disabled={!note.trim()} onClick={() => act(() => post(`/api/leads/${lead.id}/notes`, { body: note }).then(() => setNote("")), "Note added")}>Add</Btn>
            </div>
          </section>

          <section className="border border-line bg-card px-6 py-6">
            <h2 className="label-tech mb-4 text-fog-muted">Activity timeline</h2>
            <div>
              {lead.activities.map((a, i) => (
                <div key={a.id} className="relative flex gap-4 pb-5">
                  <div className="flex flex-col items-center">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-fg/60" />
                    {i < lead.activities.length - 1 && <span className="w-px flex-1 bg-line" />}
                  </div>
                  <div className="-mt-0.5">
                    <p className="text-sm text-fog-dim">{a.description}</p>
                    <p className="mt-0.5 text-[11px] text-fog-muted">{a.actor} · {fmtDT(a.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="border border-line bg-card px-5 py-5">
            <h2 className="label-tech mb-4 text-fog-muted">Manage</h2>
            <Label>Assigned to</Label>
            <Select value={lead.assignedTo?.id || ""} onChange={(e) => act(() => post(`/api/leads/${lead.id}/assign`, { assignedTo: e.target.value || null }), "Assignment updated")}>
              <option value="">Unassigned</option>
              {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </Select>
            <div className="mt-4"><Label>Status</Label>
              <Select value={lead.status} onChange={(e) => act(() => patch(`/api/leads/${lead.id}`, { status: e.target.value }), "Status updated")}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </div>
            <div className="mt-4"><Label>Priority</Label>
              <Select value={lead.priority} onChange={(e) => act(() => patch(`/api/leads/${lead.id}`, { priority: e.target.value }), "Priority updated")}>
                {PRIORITIES.map((s) => <option key={s}>{s}</option>)}
              </Select>
            </div>
            <div className="mt-4"><Label>Next follow-up</Label>
              <Input type="datetime-local" value={lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : ""}
                onChange={(e) => act(() => patch(`/api/leads/${lead.id}`, { nextFollowUpAt: e.target.value ? new Date(e.target.value).toISOString() : null }), "Follow-up scheduled")} />
            </div>
            <div className="mt-4"><Label>Add tag</Label>
              <div className="flex gap-2">
                <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. enterprise" />
                <Btn variant="ghost" disabled={!tag.trim()} onClick={() => act(() => patch(`/api/leads/${lead.id}`, { tags: [...lead.tags, tag.trim()] }).then(() => setTag("")), "Tag added")}>Add</Btn>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">{lead.tags.map((t) => <Badge key={t}>{t}</Badge>)}</div>
            </div>
          </section>

          <section className="border border-line bg-card px-5 py-5">
            <h2 className="label-tech mb-4 text-fog-muted">Email history</h2>
            {lead.emails.length === 0 && <p className="text-sm text-fog-muted">No emails logged yet.</p>}
            {lead.emails.map((e) => (
              <div key={e.id} className="border-b border-linesoft py-2.5 last:border-0">
                <p className="text-xs text-fog-dim">{e.subject}</p>
                <p className="mt-0.5 text-[10px] text-fog-muted">{e.type} · {e.status} · {fmtDT(e.sentAt)}</p>
              </div>
            ))}
          </section>
        </div>
      </div>

      <Modal open={mailOpen} onClose={() => setMailOpen(false)} title="Send email to lead" wide>
        <Label>Template (optional)</Label>
        <Select value={mail.templateId} onChange={(e) => {
          const t = tpls.find((x) => x.id === e.target.value);
          setMail((m) => ({ ...m, templateId: e.target.value, subject: t ? t.subject : m.subject }));
        }}>
          <option value="">Write from scratch</option>
          {tpls.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
        <div className="mt-4"><Label>To</Label><Input value={lead.email} disabled /></div>
        <div className="mt-4"><Label>Subject</Label><Input value={mail.subject} onChange={(e) => setMail((m) => ({ ...m, subject: e.target.value }))} /></div>
        <div className="mt-4"><Label>Message</Label><Textarea rows={8} value={mail.message} onChange={(e) => setMail((m) => ({ ...m, message: e.target.value }))} placeholder="Hi …" /></div>
        <p className="mt-2 text-[11px] text-fog-muted">Templates resolve {"{{name}} {{company}} {{projectType}} {{assignedEmployee}} {{aynamSiteUrl}}"} safely. Sent from the studio address — no spoofing.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Btn variant="ghost" onClick={() => setMailOpen(false)}>Cancel</Btn>
          <Btn disabled={sending || !mail.subject || !mail.message} onClick={async () => {
            setSending(true);
            await post(`/api/leads/${lead.id}/email`, mail);
            setSending(false);
            setMailOpen(false);
            setMail({ subject: "", message: "", templateId: "" });
            load();
          }}>{sending ? "Sending…" : "Send →"}</Btn>
        </div>
      </Modal>
    </AdminShell>
  );
}
