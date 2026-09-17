import { Lead } from "@/lib/server/models/Lead";
import { ok, requireUser } from "@/lib/server/guards";
import { leadScopeFilter } from "@/lib/server/services/leads";
import { audit } from "@/lib/server/audit";
import * as XLSX from "xlsx";

const csvCell = (v: unknown): string => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: Request) {
  const { user, res } = await requireUser("leads.export");
  if (res) return res;
  const format = new URL(req.url).searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const leads = await Lead.find({ deletedAt: null, ...leadScopeFilter(user) })
    .sort({ createdAt: -1 })
    .limit(20000)
    .populate("assignedTo", "name")
    .lean();
  const rows = leads.map((l) => ({
    name: l.name,
    email: l.email,
    phone: l.phone || "",
    company: l.company || "",
    projectType: l.projectType || "",
    budget: l.budget || "",
    status: l.status,
    priority: l.priority,
    source: l.source,
    assignedTo: l.assignedTo ? (l.assignedTo as unknown as { name: string }).name : "",
    tags: (l.tags || []).join("|"),
    lastContactedAt: l.lastContactedAt ? new Date(l.lastContactedAt).toISOString() : "",
    nextFollowUpAt: l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toISOString() : "",
    createdAt: new Date(l.createdAt).toISOString(),
    message: l.message || "",
  }));
  await audit(user._id, "lead.export", "lead", undefined, { format, count: rows.length });
  if (format === "xlsx") {
    const ws = XLSX.utils.json_to_sheet(rows);
    const buf = XLSX.write({ SheetNames: ["Leads"], Sheets: { Leads: ws } }, { type: "buffer", bookType: "xlsx" });
    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="AYNAM_LEADS_EXPORT.xlsx"',
      },
    });
  }
  const header = Object.keys(rows[0] || { name: "", email: "" });
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => csvCell((r as Record<string, unknown>)[h])).join(","))].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="AYNAM_LEADS_EXPORT.csv"' },
  });
}
