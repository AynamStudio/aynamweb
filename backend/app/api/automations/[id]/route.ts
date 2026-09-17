import mongoose from "mongoose";
import { z } from "zod";
import { Automation } from "@/lib/server/models/Automation";
import { notFound, ok, parseBody, requireUser } from "@/lib/server/guards";
import { automationPatchSchema } from "@/lib/server/validators";
import { audit } from "@/lib/server/audit";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("automations.edit");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const a = await Automation.findById(id);
  if (!a) return notFound();
  const { data, res: bad } = await parseBody<z.infer<typeof automationPatchSchema>>(req, automationPatchSchema);
  if (bad) return bad;
  Object.assign(a, data);
  await a.save();
  await audit(user._id, "automation.update", "automation", String(a._id));
  return ok({ id: String(a._id) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("automations.delete");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  await Automation.findByIdAndDelete(id);
  await audit(user._id, "automation.delete", "automation", id);
  return ok({ deleted: true });
}
