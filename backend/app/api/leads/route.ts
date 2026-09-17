import { z } from "zod";
import { Lead, LEAD_PRIORITIES, LEAD_SOURCES, LEAD_STATUSES } from "@/lib/server/models/Lead";
import { User } from "@/lib/server/models/User";
import { badRequest, forbidden, ok, parseBody, requireUser } from "@/lib/server/guards";
import { leadCreateSchema } from "@/lib/server/validators";
import { escapeRegExp, leadScopeFilter, normEmail } from "@/lib/server/services/leads";
import { activity, notify } from "@/lib/server/audit";
import { emitAutomation } from "@/lib/server/services/automation";

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  status: { status: 1 },
  priority: { priority: 1 },
  followup: { nextFollowUpAt: 1 },
};

export async function GET(req: Request) {
  const { user, res } = await requireUser("leads.view");
  if (res) return res;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = url.searchParams.get("status") || "";
  const priority = url.searchParams.get("priority") || "";
  const source = url.searchParams.get("source") || "";
  const assigned = url.searchParams.get("assigned") || "";
  const sort = SORTS[url.searchParams.get("sort") || "newest"] || SORTS.newest;
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(5, Number(url.searchParams.get("limit") || 20)));

  const filter: Record<string, unknown> = { deletedAt: null, ...leadScopeFilter(user) };
  if (q) {
    const rx = new RegExp(escapeRegExp(q), "i");
    filter.$or = [{ name: rx }, { email: rx }, { company: rx }, { phone: rx }];
  }
  if (status && (LEAD_STATUSES as readonly string[]).includes(status)) filter.status = status;
  if (priority && (LEAD_PRIORITIES as readonly string[]).includes(priority)) filter.priority = priority;
  if (source && (LEAD_SOURCES as readonly string[]).includes(source)) filter.source = source;
  if (assigned === "unassigned") filter.assignedTo = null;
  else if (assigned === "me") filter.assignedTo = user._id;
  else if (assigned) filter.assignedTo = assigned;

  const [items, total] = await Promise.all([
    Lead.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).populate("assignedTo", "name email"),
    Lead.countDocuments(filter),
  ]);
  return ok({
    items: items.map((l) => ({
      id: String(l._id),
      name: l.name,
      email: l.email,
      phone: l.phone || "",
      company: l.company || "",
      projectType: l.projectType || "",
      budget: l.budget || "",
      source: l.source,
      status: l.status,
      priority: l.priority,
      tags: l.tags,
      assignedTo: l.assignedTo ? { id: String((l.assignedTo as { _id: unknown })._id), name: (l.assignedTo as { name: string }).name } : null,
      lastContactedAt: l.lastContactedAt || null,
      nextFollowUpAt: l.nextFollowUpAt || null,
      emailStatus: l.emailStatus || null,
      createdAt: l.createdAt,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function POST(req: Request) {
  const { user, res } = await requireUser("leads.create");
  if (res) return res;
  const { data, res: bad } = await parseBody<z.infer<typeof leadCreateSchema>>(req, leadCreateSchema);
  if (bad) return bad;
  const lead = await Lead.create({
    ...data,
    emailLower: normEmail(data.email),
    email: data.email.trim(),
    source: "MANUAL",
    status: data.status || "NEW",
    priority: data.priority || "MEDIUM",
  });
  await activity(lead._id, user._id, "created", `Lead created manually by ${user.name}`);
  await emitAutomation("lead.created", lead, user._id);
  return ok({ id: String(lead._id) }, { status: 201 });
}
