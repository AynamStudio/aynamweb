import mongoose from "mongoose";
import { z } from "zod";
import { Lead } from "@/lib/server/models/Lead";
import { ImportJob } from "@/lib/server/models/ImportJob";
import { badRequest, notFound, ok, parseBody, requireUser } from "@/lib/server/guards";
import { normEmail } from "@/lib/server/services/leads";
import { takeImport } from "@/lib/server/services/importStore";
import { activity, audit, notify } from "@/lib/server/audit";
import { LEAD_PRIORITIES, LEAD_STATUSES } from "@/lib/server/models/Lead";

const FIELDS = ["name", "email", "phone", "company", "projectType", "budget", "message", "status", "priority", "tags"] as const;
type Field = (typeof FIELDS)[number];

const commitSchema = z.object({
  jobId: z.string().min(1),
  mapping: z.record(z.string(), z.string()),
  duplicatePolicy: z.enum(["skip", "update", "create"]).default("skip"),
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("leads.import");
  if (res) return res;
  const { data, res: bad } = await parseBody<z.infer<typeof commitSchema>>(req, commitSchema);
  if (bad) return bad;
  const { id } = await ctx.params;
  const jobId = mongoose.isValidObjectId(id) ? id : data.jobId || "";
  const stored = takeImport(jobId, String(user._id));
  if (!stored) return notFound();

  const mapping = Object.entries(data.mapping).filter(([f]) => (FIELDS as readonly string[]).includes(f)) as [Field, string][];
  const get = (row: Record<string, string>, field: Field): string => {
    const col = mapping.find(([f]) => f === field)?.[1];
    return col ? (row[col] || "").trim() : "";
  };

  const errors: { row: number; field: string; message: string }[] = [];
  const valid: { row: number; values: Record<string, string> }[] = [];
  const seenInFile = new Set<string>();
  const existing = new Map<string, typeof Lead.prototype>();
  const emails = stored.rows.map((r) => normEmail(get(r, "email"))).filter(Boolean);
  for (const lead of await Lead.find({ emailLower: { $in: emails }, deletedAt: null })) {
    existing.set(lead.emailLower, lead);
  }

  let duplicates = 0;
  stored.rows.forEach((row, i) => {
    const email = normEmail(get(row, "email"));
    const name = get(row, "name") || get(row, "company") || email.split("@")[0];
    if (!email) return errors.push({ row: i + 2, field: "email", message: "Missing email" });
    if (!EMAIL_RE.test(email)) return errors.push({ row: i + 2, field: "email", message: "Invalid email" });
    if (!name) return errors.push({ row: i + 2, field: "name", message: "Missing name" });
    if (name.length > 100) return errors.push({ row: i + 2, field: "name", message: "Name too long" });
    const status = get(row, "status");
    if (status && !(LEAD_STATUSES as readonly string[]).includes(status)) return errors.push({ row: i + 2, field: "status", message: "Invalid status" });
    const priority = get(row, "priority");
    if (priority && !(LEAD_PRIORITIES as readonly string[]).includes(priority)) return errors.push({ row: i + 2, field: "priority", message: "Invalid priority" });
    if (seenInFile.has(email)) {
      duplicates++;
      return errors.push({ row: i + 2, field: "email", message: "Duplicate within file" });
    }
    seenInFile.add(email);
    valid.push({
      row: i + 2,
      values: {
        name,
        email,
        phone: get(row, "phone"),
        company: get(row, "company"),
        projectType: get(row, "projectType"),
        budget: get(row, "budget"),
        message: get(row, "message"),
        status: status || "NEW",
        priority: priority || "MEDIUM",
        tags: get(row, "tags"),
      },
    });
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;
  for (const v of valid) {
    const existingLead = existing.get(v.values.email);
    if (existingLead) {
      duplicates++;
      if (data.duplicatePolicy === "skip") {
        skipped++;
        continue;
      }
      if (data.duplicatePolicy === "update") {
        for (const [k, val] of Object.entries(v.values)) {
          if (val && k !== "email") (existingLead as unknown as Record<string, unknown>)[k] = val;
        }
        await existingLead.save();
        await activity(existingLead._id, user._id, "imported", `Lead updated via import ${stored.fileName}`);
        updated++;
        continue;
      }
    }
    const lead = await Lead.create({
      name: v.values.name,
      email: v.values.email,
      emailLower: v.values.email,
      phone: v.values.phone,
      company: v.values.company,
      projectType: v.values.projectType,
      budget: v.values.budget,
      message: v.values.message,
      status: v.values.status,
      priority: v.values.priority,
      tags: v.values.tags ? v.values.tags.split(/[|;]/).map((t) => t.trim()).filter(Boolean) : [],
      source: stored.source,
    });
    await activity(lead._id, user._id, "imported", `Lead imported from ${stored.fileName}`);
    created++;
  }

  const job = await ImportJob.create({
    fileName: stored.fileName,
    uploadedBy: user._id,
    source: stored.source,
    mapping: data.mapping,
    totalRows: stored.rows.length,
    successfulRows: created + updated,
    failedRows: errors.length,
    duplicateRows: duplicates,
    status: errors.length === 0 ? "COMPLETED" : created + updated > 0 ? "PARTIAL" : "FAILED",
    errors: errors.slice(0, 2000),
  });
  await audit(user._id, "lead.import", "import", String(job._id), { created, updated, skipped, duplicates });
  await notify(user._id, "import_completed", `Import finished: ${stored.fileName}`, `${created} created · ${updated} updated · ${duplicates} duplicates · ${errors.length} invalid`);
  return ok({
    importId: String(job._id),
    totalRows: stored.rows.length,
    created,
    updated,
    skipped,
    duplicates,
    invalid: errors.length,
    errors: errors.slice(0, 200),
  });
}
