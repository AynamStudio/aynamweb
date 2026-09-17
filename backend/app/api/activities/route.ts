import { Activity } from "@/lib/server/models/Activity";
import { Lead } from "@/lib/server/models/Lead";
import { ok, requireUser } from "@/lib/server/guards";
import { leadScopeFilter } from "@/lib/server/services/leads";

export async function GET(req: Request) {
  const { user, res } = await requireUser("activity.view");
  if (res) return res;
  const leadId = new URL(req.url).searchParams.get("leadId") || "";
  const limit = Math.min(100, Number(new URL(req.url).searchParams.get("limit") || 30));
  const filter: Record<string, unknown> = leadId ? { leadId } : {};
  if (!leadId) {
    const leads = await Lead.find({ deletedAt: null, ...leadScopeFilter(user) }).select("_id").limit(1000);
    filter.leadId = { $in: leads.map((l) => l._id) };
  }
  const items = await Activity.find(filter).sort({ createdAt: -1 }).limit(limit).populate("actorId", "name");
  return ok({
    items: items.map((a) => ({
      id: String(a._id),
      leadId: a.leadId ? String(a.leadId) : null,
      type: a.type,
      description: a.description,
      actor: a.actorId ? (a.actorId as unknown as { name: string }).name : "System",
      createdAt: a.createdAt,
    })),
  });
}
