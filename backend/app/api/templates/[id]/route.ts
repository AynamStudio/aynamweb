import mongoose from "mongoose";
import { z } from "zod";
import { EmailTemplate } from "@/lib/server/models/EmailTemplate";
import { notFound, ok, parseBody, requireUser } from "@/lib/server/guards";
import { sanitizeTemplateHtml, templatePatchSchema } from "@/lib/server/validators";
import { audit } from "@/lib/server/audit";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("templates.edit");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const tpl = await EmailTemplate.findById(id);
  if (!tpl) return notFound();
  const { data, res: bad } = await parseBody<z.infer<typeof templatePatchSchema>>(req, templatePatchSchema);
  if (bad) return bad;
  Object.assign(tpl, data);
  if (data.html) tpl.html = sanitizeTemplateHtml(data.html);
  await tpl.save();
  await audit(user._id, "template.update", "template", String(tpl._id));
  return ok({ id: String(tpl._id) });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("templates.delete");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  await EmailTemplate.findByIdAndDelete(id);
  await audit(user._id, "template.delete", "template", id);
  return ok({ deleted: true });
}
