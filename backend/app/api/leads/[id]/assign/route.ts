import mongoose from "mongoose";
import { z } from "zod";
import { Lead } from "@/lib/server/models/Lead";
import { User } from "@/lib/server/models/User";
import { badRequest, notFound, ok, parseBody, requireUser } from "@/lib/server/guards";
import { assignSchema } from "@/lib/server/validators";
import { leadScopeFilter } from "@/lib/server/services/leads";
import { activity, audit, notify } from "@/lib/server/audit";
import { emitAutomation } from "@/lib/server/services/automation";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("leads.assign");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const lead = await Lead.findOne({ _id: id, deletedAt: null, ...leadScopeFilter(user) });
  if (!lead) return notFound();
  const { data, res: bad } = await parseBody<z.infer<typeof assignSchema>>(req, assignSchema);
  if (bad) return bad;
  if (data.assignedTo) {
    const target = await User.findOne({ _id: data.assignedTo, status: "ACTIVE" });
    if (!target) return badRequest("Unknown employee.");
    lead.assignedTo = target._id;
    lead.assignedAt = new Date();
    lead.assignedBy = user._id;
    await lead.save();
    await activity(lead._id, user._id, "assigned", `Lead assigned to ${target.name}`);
    await notify(target._id, "lead_assigned", `New lead assigned: ${lead.name}`, lead.company || lead.email);
    await audit(user._id, "lead.assign", "lead", String(lead._id), { to: String(target._id) });
    await emitAutomation("lead.assigned", lead, user._id);
  } else {
    lead.assignedTo = null;
    lead.assignedAt = undefined;
    await lead.save();
    await activity(lead._id, user._id, "assigned", "Lead unassigned");
  }
  return ok({ id: String(lead._id), assignedTo: lead.assignedTo ? String(lead.assignedTo) : null });
}
