import { z } from "zod";
import { Automation } from "@/lib/server/models/Automation";
import { ok, parseBody, requireUser } from "@/lib/server/guards";
import { automationSchema } from "@/lib/server/validators";
import { audit } from "@/lib/server/audit";

export async function GET() {
  const { user, res } = await requireUser("automations.view");
  if (res) return res;
  const items = await Automation.find().sort({ createdAt: 1 });
  return ok({ items: items.map((a) => ({ id: String(a._id), name: a.name, description: a.description || "", enabled: a.enabled, trigger: a.trigger, conditions: a.conditions, actions: a.actions, updatedAt: a.updatedAt })) });
}

export async function POST(req: Request) {
  const { user, res } = await requireUser("automations.create");
  if (res) return res;
  const { data, res: bad } = await parseBody<z.infer<typeof automationSchema>>(req, automationSchema);
  if (bad) return bad;
  const a = await Automation.create({ ...data, createdBy: user._id });
  await audit(user._id, "automation.create", "automation", String(a._id));
  return ok({ id: String(a._id) }, { status: 201 });
}
