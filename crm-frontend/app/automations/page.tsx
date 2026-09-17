"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Badge, Btn, get, Input, Label, Modal, patch, post, Select, Skeleton, Textarea, del } from "@/components/admin/ui";

type Auto = { id: string; name: string; description: string; enabled: boolean; trigger: string; conditions: { field: string; op: string; value: string }[]; actions: { type: string; templateId?: string; status?: string; description?: string }[] };
const TRIGGERS = ["lead.created", "lead.assigned", "lead.status_changed", "lead.followup_due", "lead.imported"];
const ACTIONS = ["send_email", "assign_lead", "change_status", "create_activity", "notify_employee"];

export default function AutomationsPage() {
  const [items, setItems] = useState<Auto[] | null>(null);
  const [edit, setEdit] = useState<Auto | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [tpls, setTpls] = useState<{ id: string; name: string }[]>([]);

  const load = () => get<{ data: { items: Auto[] } }>("/api/automations").then(({ data }) => data && setItems(data.data.items));
  useEffect(() => {
    load();
    get<{ data: { items: { id: string; name: string }[] } }>("/api/templates").then(({ data }) => data && setTpls(data.data.items));
  }, []);

  const save = async () => {
    if (!edit) return;
    if (isNew) await post("/api/automations", edit);
    else await patch(`/api/automations/${edit.id}`, edit);
    setEdit(null);
    load();
  };

  return (
    <AdminShell>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="headline text-[clamp(1.6rem,2.6vw,2.3rem)] text-fog">Automations</h1>
          <p className="mt-2 text-sm text-fog-dim">Trigger → conditions → actions. A clean foundation, not a workflow engine.</p>
        </div>
        <Btn onClick={() => { setIsNew(true); setEdit({ id: "", name: "", description: "", enabled: true, trigger: "lead.created", conditions: [], actions: [{ type: "create_activity", description: "" }] }); }}>New automation →</Btn>
      </div>
      {!items ? <Skeleton className="h-64" /> : items.length === 0 ? (
        <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-fog-muted">No automations yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <div key={a.id} className="flex flex-col gap-4 border border-line bg-card px-6 py-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-fog">{a.name}</p>
                  <Badge tone={a.enabled ? "WON" : "neutral"}>{a.enabled ? "ENABLED" : "DISABLED"}</Badge>
                </div>
                <p className="mt-1 text-xs text-fog-muted">
                  {a.trigger} → {a.actions.map((x) => x.type).join(", ")}
                </p>
                {a.description && <p className="mt-1 text-xs text-fog-dim">{a.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Btn variant="ghost" onClick={async () => { await patch(`/api/automations/${a.id}`, { enabled: !a.enabled }); load(); }}>{a.enabled ? "Disable" : "Enable"}</Btn>
                <Btn variant="ghost" onClick={() => { setIsNew(false); setEdit(a); }}>Edit</Btn>
                <Btn variant="danger" onClick={async () => { if (confirm(`Delete automation ${a.name}?`)) { await del(`/api/automations/${a.id}`); load(); } }}>Delete</Btn>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={isNew ? "New automation" : "Edit automation"} wide>
        {edit && (
          <>
            <Label>Name</Label><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            <div className="mt-4"><Label>Description</Label><Input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div><Label>Trigger</Label><Select value={edit.trigger} onChange={(e) => setEdit({ ...edit, trigger: e.target.value })}>{TRIGGERS.map((t) => <option key={t}>{t}</option>)}</Select></div>
              <div><Label>Enabled</Label><Select value={edit.enabled ? "yes" : "no"} onChange={(e) => setEdit({ ...edit, enabled: e.target.value === "yes" })}><option value="yes">Yes</option><option value="no">No</option></Select></div>
            </div>
            <h3 className="label-tech mb-2 mt-6 text-fog-muted">Actions</h3>
            {edit.actions.map((act, i) => (
              <div key={i} className="mb-3 grid grid-cols-1 gap-3 border border-line px-4 py-3 md:grid-cols-3">
                <Select value={act.type} onChange={(e) => { const actions = [...edit.actions]; actions[i] = { ...actions[i], type: e.target.value }; setEdit({ ...edit, actions }); }}>
                  {ACTIONS.map((t) => <option key={t}>{t}</option>)}
                </Select>
                {act.type === "send_email" ? (
                  <Select value={act.templateId || ""} onChange={(e) => { const actions = [...edit.actions]; actions[i] = { ...actions[i], templateId: e.target.value }; setEdit({ ...edit, actions }); }}>
                    <option value="">Choose template…</option>
                    {tpls.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </Select>
                ) : act.type === "change_status" ? (
                  <Select value={act.status || ""} onChange={(e) => { const actions = [...edit.actions]; actions[i] = { ...actions[i], status: e.target.value }; setEdit({ ...edit, actions }); }}>
                    <option value="">Status…</option>
                    {["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ON_HOLD"].map((s) => <option key={s}>{s}</option>)}
                  </Select>
                ) : (
                  <Input placeholder="Description (optional)" value={act.description || ""} onChange={(e) => { const actions = [...edit.actions]; actions[i] = { ...actions[i], description: e.target.value }; setEdit({ ...edit, actions }); }} />
                )}
                <Btn variant="ghost" onClick={() => setEdit({ ...edit, actions: edit.actions.filter((_, x) => x !== i) })}>Remove</Btn>
              </div>
            ))}
            <Btn variant="ghost" onClick={() => setEdit({ ...edit, actions: [...edit.actions, { type: "create_activity" }] })}>+ Add action</Btn>
            <div className="mt-6 flex justify-end gap-3">
              <Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn>
              <Btn disabled={!edit.name} onClick={save}>Save</Btn>
            </div>
          </>
        )}
      </Modal>
    </AdminShell>
  );
}
