import { Lead } from "@/lib/server/models/Lead";
import { Activity } from "@/lib/server/models/Activity";
import { ok, requireUser } from "@/lib/server/guards";
import { leadScopeFilter } from "@/lib/server/services/leads";

export async function GET() {
  const { user, res } = await requireUser("leads.view");
  if (res) return res;
  const scope = { deletedAt: null, ...leadScopeFilter(user) };
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 3600_000);
  const [byStatus, today, unassigned, followups, sources, recent, activities] = await Promise.all([
    Lead.aggregate([{ $match: scope }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Lead.countDocuments({ ...scope, createdAt: { $gte: startOfDay, $lt: endOfDay } }),
    Lead.countDocuments({ ...scope, assignedTo: null }),
    Lead.countDocuments({ ...scope, nextFollowUpAt: { $lte: endOfDay } }),
    Lead.aggregate([{ $match: scope }, { $group: { _id: "$source", count: { $sum: 1 } } }]),
    Lead.find(scope).sort({ createdAt: -1 }).limit(6).populate("assignedTo", "name"),
    Activity.find().sort({ createdAt: -1 }).limit(8).populate("actorId", "name"),
  ]);
  const statusCounts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  return ok({
    totals: {
      all: Object.values(statusCounts).reduce((a: number, b) => a + (b as number), 0),
      today,
      unassigned,
      followupsDue: followups,
      byStatus: statusCounts,
    },
    sources: Object.fromEntries(sources.map((s) => [s._id, s.count])),
    recentLeads: recent.map((l) => ({
      id: String(l._id),
      name: l.name,
      company: l.company || "",
      status: l.status,
      priority: l.priority,
      source: l.source,
      createdAt: l.createdAt,
      assignedTo: l.assignedTo ? (l.assignedTo as unknown as { name: string }).name : null,
    })),
    recentActivity: activities.map((a) => ({
      id: String(a._id),
      description: a.description,
      actor: a.actorId ? (a.actorId as unknown as { name: string }).name : "System",
      createdAt: a.createdAt,
    })),
  });
}
