import { z } from "zod";
import { EmailTemplate } from "@/lib/server/models/EmailTemplate";
import { ok, parseBody, requireUser } from "@/lib/server/guards";
import { sanitizeTemplateHtml, templateSchema } from "@/lib/server/validators";
import { audit } from "@/lib/server/audit";

export async function GET() {
  const { user, res } = await requireUser("templates.view");
  if (res) return res;
  const items = await EmailTemplate.find().sort({ name: 1 });
  return ok({ items: items.map((t) => ({ id: String(t._id), name: t.name, subject: t.subject, html: t.html, category: t.category, status: t.status, updatedAt: t.updatedAt })) });
}

export async function POST(req: Request) {
  const { user, res } = await requireUser("templates.create");
  if (res) return res;
  const { data, res: bad } = await parseBody<z.infer<typeof templateSchema>>(req, templateSchema);
  if (bad) return bad;
  const tpl = await EmailTemplate.create({ ...data, html: sanitizeTemplateHtml(data.html), createdBy: user._id });
  await audit(user._id, "template.create", "template", String(tpl._id));
  return ok({ id: String(tpl._id) }, { status: 201 });
}
