import mongoose from "mongoose";
import { z } from "zod";
import { Lead } from "@/lib/server/models/Lead";
import { User } from "@/lib/server/models/User";
import { notFound, ok, parseBody, requireUser } from "@/lib/server/guards";
import { leadEmailSchema } from "@/lib/server/validators";
import { leadScopeFilter } from "@/lib/server/services/leads";
import { EmailService, resolveTemplateVars, templateBodyToHtml } from "@/lib/server/services/emailService";
import { activity } from "@/lib/server/audit";
import { EmailTemplate } from "@/lib/server/models/EmailTemplate";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("emails.send");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const lead = await Lead.findOne({ _id: id, deletedAt: null, ...leadScopeFilter(user) });
  if (!lead) return notFound();
  const { data, res: bad } = await parseBody<z.infer<typeof leadEmailSchema>>(req, leadEmailSchema);
  if (bad) return bad;

  let subject = data.subject;
  let bodyHtml = templateBodyToHtml(data.message);
  let templateId: string | null = null;
  if (data.templateId) {
    const tpl = await EmailTemplate.findOne({ _id: data.templateId, status: "ACTIVE" });
    if (tpl) {
      subject = resolveTemplateVars(tpl.subject, lead, user.name);
      bodyHtml = templateBodyToHtml(resolveTemplateVars(tpl.html, lead, user.name));
      templateId = String(tpl._id);
    }
  }
  const sent = await EmailService.sendTemplateEmail({
    to: lead.email,
    subject,
    bodyHtml,
    leadId: lead._id,
    templateId,
    replyTo: user.email,
  });
  if (sent) {
    lead.lastContactedAt = new Date();
    await lead.save();
    await activity(lead._id, user._id, "email_sent", `Email sent to ${lead.email}: ${subject}`);
  }
  return ok({ sent });
}
