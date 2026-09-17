"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Badge, Btn, get, Input, Label, Modal, patch, post, Select, Skeleton, Textarea, del } from "@/components/admin/ui";

type Tpl = { id: string; name: string; subject: string; html: string; category: string; status: string };
const CATS = ["CONTACT_CONFIRMATION", "FOLLOW_UP", "PROPOSAL", "GENERAL", "WELCOME", "INTERNAL"];

export default function TemplatesPage() {
  const [tpls, setTpls] = useState<Tpl[] | null>(null);
  const [edit, setEdit] = useState<Tpl | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = () => get<{ data: { items: Tpl[] } }>("/api/templates").then(({ data }) => data && setTpls(data.data.items));
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!edit) return;
    if (isNew) await post("/api/templates", edit);
    else await patch(`/api/templates/${edit.id}`, edit);
    setEdit(null);
    load();
  };

  return (
    <AdminShell>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="headline text-[clamp(1.6rem,2.6vw,2.3rem)] text-fog">Templates</h1>
          <p className="mt-2 text-sm text-fog-dim">Approved email templates with {"{{variables}}"} resolved safely at send time.</p>
        </div>
        <Btn onClick={() => { setIsNew(true); setEdit({ id: "", name: "", subject: "", html: "", category: "GENERAL", status: "ACTIVE" }); }}>New template →</Btn>
      </div>
      {!tpls ? <Skeleton className="h-64" /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tpls.map((t) => (
            <div key={t.id} className="border border-line bg-card px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-fog">{t.name}</p>
                <Badge tone={t.status === "ACTIVE" ? "WON" : "neutral"}>{t.status}</Badge>
              </div>
              <p className="mt-1 text-xs text-fog-muted">{t.category}</p>
              <p className="mt-3 line-clamp-2 text-xs text-fog-dim">{t.subject}</p>
              <div className="mt-4 flex gap-2">
                <Btn variant="ghost" onClick={() => { setIsNew(false); setEdit(t); }}>Edit</Btn>
                <Btn variant="danger" onClick={async () => { if (confirm(`Delete template ${t.name}?`)) { await del(`/api/templates/${t.id}`); load(); } }}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? "New template" : "Edit template"} wide>
        {edit && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Name</Label><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><Label>Category</Label><Select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</Select></div>
            </div>
            <div className="mt-4"><Label>Subject</Label><Input value={edit.subject} onChange={(e) => setEdit({ ...edit, subject: e.target.value })} /></div>
            <div className="mt-4"><Label>Body (plain text lines; variables allowed)</Label>
              <Textarea rows={10} value={edit.html} onChange={(e) => setEdit({ ...edit, html: e.target.value })} />
            </div>
            <p className="mt-2 text-[11px] text-fog-muted">{"Variables: {{name}} {{company}} {{projectType}} {{assignedEmployee}} {{aynamSiteUrl}} {{email}} — values are escaped. Scripts and handlers are stripped on save."}</p>
            <div className="mt-6 flex justify-end gap-3">
              <Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn>
              <Btn disabled={!edit.name || !edit.subject || !edit.html} onClick={save}>Save</Btn>
            </div>
          </>
        )}
      </Modal>
    </AdminShell>
  );
}
