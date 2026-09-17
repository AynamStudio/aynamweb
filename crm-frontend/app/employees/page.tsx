"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { Badge, Btn, fmtDT, get, Input, Label, Modal, patch, post, Select, Skeleton } from "@/components/admin/ui";
import { PERMISSIONS, ROLE_PRESETS, ROLES } from "@/lib/server/permissions";

type Emp = { id: string; name: string; email: string; phone: string; role: string; department: string; status: string; permissions: string[]; lastLoginAt: string | null; createdAt: string };

const GROUPS: Record<string, string[]> = {
  LEADS: PERMISSIONS.filter((p) => p.startsWith("leads")),
  EMPLOYEES: PERMISSIONS.filter((p) => p.startsWith("employees")),
  EMAIL: PERMISSIONS.filter((p) => p.startsWith("emails")),
  AUTOMATIONS: PERMISSIONS.filter((p) => p.startsWith("automations")),
  TEMPLATES: PERMISSIONS.filter((p) => p.startsWith("templates")),
  OTHER: PERMISSIONS.filter((p) => ["contacts.view", "settings.view", "settings.edit", "activity.view"].includes(p)),
};

export default function EmployeesPage() {
  const [emps, setEmps] = useState<Emp[] | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [edit, setEdit] = useState<Emp | null>(null);
  const [tempPass, setTempPass] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "SALES" as string, department: "" });

  const load = () => get<{ data: { items: Emp[] } }>("/api/employees").then(({ data }) => data && setEmps(data.data.items));
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data } = await post<{ data: { id: string; temporaryPassword: string } }>("/api/employees", form);
    if (data) {
      setTempPass(data.data.temporaryPassword);
      setCreateOpen(false);
      setForm({ name: "", email: "", phone: "", role: "SALES", department: "" });
      load();
    }
  };

  return (
    <AdminShell>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="headline text-[clamp(1.6rem,2.6vw,2.3rem)] text-fog">Employees</h1>
          <p className="mt-2 text-sm text-fog-dim">Accounts, roles and granular permissions.</p>
        </div>
        <Btn onClick={() => setCreateOpen(true)}>New employee →</Btn>
      </div>

      {tempPass && (
        <div className="mb-6 border border-line bg-card px-5 py-4">
          <p className="text-sm text-fog">Temporary password (shown once): <code className="rounded bg-fg/10 px-2 py-0.5 text-xs">{tempPass}</code></p>
          <p className="mt-1 text-xs text-fog-muted">Share securely. The employee should reset access after first login.</p>
          <button className="label-tech mt-2 text-fog-muted hover:text-fog" onClick={() => setTempPass(null)}>Dismiss</button>
        </div>
      )}

      {!emps ? <Skeleton className="h-64" /> : (
        <div className="overflow-x-auto border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-linesoft">
              {["Name", "Role", "Status", "Permissions", "Last login", "Created", ""].map((h) => <th key={h} className="label-tech px-4 py-3 font-normal text-fog-muted">{h}</th>)}
            </tr></thead>
            <tbody>
              {emps.map((e) => (
                <tr key={e.id} className="border-b border-linesoft last:border-0 hover:bg-fg/5">
                  <td className="px-4 py-3"><p className="text-fog">{e.name}</p><p className="text-xs text-fog-muted">{e.email}</p></td>
                  <td className="px-4 py-3 text-fog-dim">{e.role}</td>
                  <td className="px-4 py-3"><Badge tone={e.status === "ACTIVE" ? "WON" : e.status === "DISABLED" ? "LOST" : "CONTACTED"}>{e.status}</Badge></td>
                  <td className="px-4 py-3 text-xs text-fog-muted">{e.role === "ADMIN" ? "All" : `${e.permissions.length} granted`}</td>
                  <td className="px-4 py-3 text-xs text-fog-muted">{e.lastLoginAt ? fmtDT(e.lastLoginAt) : "never"}</td>
                  <td className="px-4 py-3 text-xs text-fog-muted">{fmtDT(e.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Btn variant="ghost" onClick={() => setEdit(e)}>Edit</Btn>
                      <Btn variant="ghost" onClick={async () => { const { data } = await patch<{ data: { temporaryPassword: string | null } }>(`/api/employees/${e.id}`, { resetPassword: true }); if (data?.data.temporaryPassword) setTempPass(data.data.temporaryPassword); load(); }}>Reset access</Btn>
                      {e.status !== "DISABLED" && <Btn variant="danger" onClick={async () => { if (confirm(`Disable ${e.name}?`)) { await fetch(`/api/employees/${e.id}`, { method: "DELETE" }); load(); } }}>Disable</Btn>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create employee">
        <Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="mt-4"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div><Label>Role</Label><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select></div>
          <div><Label>Department</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
        </div>
        <p className="mt-4 text-xs text-fog-muted">Permissions default to the {form.role} preset and can be edited after creation. A temporary password is generated and shown once.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Btn variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Btn>
          <Btn disabled={!form.name || !form.email} onClick={create}>Create →</Btn>
        </div>
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={`Edit — ${edit?.name || ""}`} wide>
        {edit && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Role</Label><Select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</Select></div>
              <div><Label>Status</Label><Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>{["ACTIVE", "DISABLED", "INVITED"].map((s) => <option key={s}>{s}</option>)}</Select></div>
            </div>
            <h3 className="label-tech mb-3 mt-7 text-fog-muted">Permissions</h3>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {Object.entries(GROUPS).map(([group, perms]) => (
                <div key={group} className="border border-line px-4 py-3">
                  <p className="label-tech mb-2 text-fog-muted">{group}</p>
                  {perms.map((p) => (
                    <label key={p} className="flex items-center gap-2.5 py-1 text-sm text-fog-dim">
                      <input
                        type="checkbox"
                        checked={edit.permissions.includes(p)}
                        onChange={(e) => setEdit({ ...edit, permissions: e.target.checked ? [...edit.permissions, p] : edit.permissions.filter((x) => x !== p) })}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Btn variant="ghost" onClick={() => setEdit(null)}>Cancel</Btn>
              <Btn onClick={async () => { await patch(`/api/employees/${edit.id}`, { role: edit.role, status: edit.status, permissions: edit.permissions }); setEdit(null); load(); }}>Save changes</Btn>
            </div>
          </>
        )}
      </Modal>
    </AdminShell>
  );
}
