import { z } from "zod";
import { Lead, LEAD_PRIORITIES, LEAD_STATUSES } from "@/lib/server/models/Lead";
import { User } from "@/lib/server/models/User";
import { badRequest, forbidden, ok, parseBody, requireUser } from "@/lib/server/guards";
import { bulkSchema } from "@/lib/server/validators";
import { leadScopeFilter } from "@/lib/server/services/leads";
import { activity, audit } from "@/lib/server/audit";
import type { Permission } from "@/lib/server/permissions";

export async function PATCH(req: Request) {
  const { data, res: bad } = await parseBody<z.infer<typeof bulkSchema>>(req, bulkSchema);
  if (bad) return bad;
  const permFor: Record<string, Permission> = { assign: "leads.assign", status: "leads.edit", priority: "leads.edit", tag: "leads.edit" };
  const { user, res } = await requireUser(permFor[data.action]);
  if (res) return res;
  const filter = { _id: { $in: data.ids }, deletedAt: null, ...leadScopeFilter(user) };
  const leads = await Lead.find(filter);
  let changed = 0;
  for (const lead of leads) {
    if (data.action === "assign") {
      if (data.value === "") lead.assignedTo = null;
      else {
        const target = await User.findOne({ _id: data.value, status: "ACTIVE" });
        if (!target) continue;
        lead.assignedTo = target._id;
        lead.assignedAt = new Date();
        lead.assignedBy = user._id;
      }
    } else if (data.action === "status") {
      if (!(LEAD_STATUSES as readonly string[]).includes(data.value)) return badRequest("Invalid status.");
      lead.status = data.value as (typeof LEAD_STATUSES)[number];
    } else if (data.action === "priority") {
      if (!(LEAD_PRIORITIES as readonly string[]).includes(data.value)) return badRequest("Invalid priority.");
      lead.priority = data.value as (typeof LEAD_PRIORITIES)[number];
    } else if (data.action === "tag") {
      if (data.value && !lead.tags.includes(data.value)) lead.tags.push(data.value);
    }
    await lead.save();
    await activity(lead._id, user._id, "bulk", `Bulk ${data.action}: ${data.value || "cleared"}`);
    changed++;
  }
  await audit(user._id, `lead.bulk_${data.action}`, "lead", undefined, { count: changed });
  return ok({ changed });
}
