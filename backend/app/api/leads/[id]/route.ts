import mongoose from "mongoose";
import { z } from "zod";
import { Lead } from "@/lib/server/models/Lead";
import { Note } from "@/lib/server/models/Note";
import { Activity } from "@/lib/server/models/Activity";
import { EmailLog } from "@/lib/server/models/EmailLog";
import { User } from "@/lib/server/models/User";
import { forbidden, notFound, ok, parseBody, requireUser } from "@/lib/server/guards";
import { leadPatchSchema } from "@/lib/server/validators";
import { leadScopeFilter } from "@/lib/server/services/leads";
import { activity, audit } from "@/lib/server/audit";
import { emitAutomation } from "@/lib/server/services/automation";
import { notify } from "@/lib/server/audit";

async function findScoped(id: string, user: NonNullable<Awaited<ReturnType<typeof requireUser>>["user"]>) {
  if (!user) return null;
  if (!mongoose.isValidObjectId(id)) return null;
  return Lead.findOne({ _id: id, deletedAt: null, ...leadScopeFilter(user) });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("leads.view");
  if (res) return res;
  const { id } = await ctx.params;
  const lead = await findScoped(id, user).then((l) => l?.populate("assignedTo", "name email"));
  if (!lead) return notFound();
  const [notes, activities, emails] = await Promise.all([
    Note.find({ leadId: lead._id }).sort({ createdAt: -1 }).populate("authorId", "name"),
    Activity.find({ leadId: lead._id }).sort({ createdAt: -1 }).limit(100).populate("actorId", "name"),
    EmailLog.find({ leadId: lead._id }).sort({ sentAt: -1 }).limit(50),
  ]);
  return ok({
    id: String(lead._id),
    name: lead.name,
    email: lead.email,
    phone: lead.phone || "",
    company: lead.company || "",
    projectType: lead.projectType || "",
    budget: lead.budget || "",
    message: lead.message || "",
    source: lead.source,
    status: lead.status,
    priority: lead.priority,
    tags: lead.tags,
    assignedTo: lead.assignedTo ? { id: String((lead.assignedTo as { _id: unknown })._id), name: (lead.assignedTo as { name: string }).name } : null,
    assignedAt: lead.assignedAt || null,
    lastContactedAt: lead.lastContactedAt || null,
    nextFollowUpAt: lead.nextFollowUpAt || null,
    emailStatus: lead.emailStatus || null,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    notes: notes.map((n) => ({ id: String(n._id), body: n.body, author: (n.authorId as { name: string }).name, createdAt: n.createdAt })),
    activities: activities.map((a) => ({ id: String(a._id), type: a.type, description: a.description, actor: a.actorId ? (a.actorId as { name: string }).name : "System", createdAt: a.createdAt })),
    emails: emails.map((e) => ({ id: String(e._id), recipient: e.recipient, subject: e.subject, type: e.type, status: e.status, templateId: e.templateId || null, sentAt: e.sentAt })),
  });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("leads.edit");
  if (res) return res;
  const { id } = await ctx.params;
  const lead = await findScoped(id, user);
  if (!lead) return notFound();
  const { data, res: bad } = await parseBody<z.infer<typeof leadPatchSchema>>(req, leadPatchSchema);
  if (bad) return bad;
  const changes: string[] = [];
  if (data.status && data.status !== lead.status) {
    changes.push(`status ${lead.status} → ${data.status}`);
    lead.status = data.status;
  }
  if (data.priority && data.priority !== lead.priority) {
    changes.push(`priority ${lead.priority} → ${data.priority}`);
    lead.priority = data.priority;
  }
  for (const f of ["name", "phone", "company", "projectType", "budget", "message", "tags"] as const) {
    if (data[f] !== undefined) (lead as unknown as Record<string, unknown>)[f] = data[f];
  }
  if (data.nextFollowUpAt !== undefined) {
    lead.nextFollowUpAt = data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : undefined;
    lead.followUpNotifiedAt = undefined;
    changes.push("follow-up scheduled");
  }
  if (data.lastContactedAt !== undefined) {
    lead.lastContactedAt = data.lastContactedAt ? new Date(data.lastContactedAt) : undefined;
  }
  await lead.save();
  if (changes.length) {
    await activity(lead._id, user._id, changes.some((c) => c.startsWith("status")) ? "status_changed" : "updated", `Lead updated: ${changes.join(", ")}`);
    if (changes.some((c) => c.startsWith("status"))) await emitAutomation("lead.status_changed", lead, user._id);
  }
  return ok({ id: String(lead._id) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("leads.delete");
  if (res) return res;
  const { id } = await ctx.params;
  const lead = await findScoped(id, user);
  if (!lead) return notFound();
  lead.deletedAt = new Date();
  lead.deletedBy = user._id;
  await lead.save();
  await activity(lead._id, user._id, "deleted", `Lead deleted (soft) by ${user.name}`);
  await audit(user._id, "lead.delete", "lead", String(lead._id));
  return ok({ deleted: true });
}
