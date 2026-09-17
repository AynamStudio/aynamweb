import { getTransporter, fromAddress, emailConfig } from "@/lib/email/transporter";
import { userConfirmationEmail } from "@/lib/email/templates/userConfirmation";
import { adminNotificationEmail } from "@/lib/email/templates/adminNotification";
import { esc, emailLayout, para } from "@/lib/email/templates/emailLayout";
import { EmailLog } from "../models/EmailLog";
import type { ILead } from "../models/Lead";
import type { Types } from "mongoose";

const leadAsEnquiry = (lead: ILead) => ({
  name: lead.name,
  email: lead.email,
  company: lead.company || "",
  phone: lead.phone || "",
  projectType: lead.projectType || "",
  budget: lead.budget || "",
  message: lead.message || "",
  receivedAt: lead.createdAt || new Date(),
});

async function send(
  args: {
    to: string;
    subject: string;
    html: string;
    type: string;
    leadId?: Types.ObjectId | null;
    templateId?: string | null;
    replyTo?: string;
  }
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    await EmailLog.create({
      leadId: args.leadId ?? null,
      recipient: args.to,
      subject: args.subject,
      templateId: args.templateId ?? null,
      type: args.type,
      status: "FAILED",
      errorCode: "SMTP_NOT_CONFIGURED",
    });
    return false;
  }
  try {
    await transporter.sendMail({
      from: fromAddress(),
      to: args.to,
      replyTo: args.replyTo,
      subject: args.subject,
      html: args.html,
    });
    await EmailLog.create({
      leadId: args.leadId ?? null,
      recipient: args.to,
      subject: args.subject,
      templateId: args.templateId ?? null,
      type: args.type,
      status: "SENT",
    });
    return true;
  } catch (e) {
    await EmailLog.create({
      leadId: args.leadId ?? null,
      recipient: args.to,
      subject: args.subject,
      templateId: args.templateId ?? null,
      type: args.type,
      status: "FAILED",
      errorCode: (e as Error).message.slice(0, 120),
    });
    return false;
  }
}

/**
 * The single email entry-point for the whole application.
 * Nodemailer lives only in lib/email/transporter — swap the provider here
 * later (Resend/Postmark/SES) without touching CRM or contact code.
 */
export const EmailService = {
  async sendUserConfirmation(lead: ILead): Promise<boolean> {
    const { subject, html } = userConfirmationEmail(leadAsEnquiry(lead));
    return send({ to: lead.email, subject, html, type: "USER_CONFIRMATION", leadId: lead._id });
  },
  async sendAdminNotification(lead: ILead): Promise<boolean> {
    const { contact } = emailConfig();
    if (!contact) return false;
    const { subject, html } = adminNotificationEmail(leadAsEnquiry(lead));
    return send({ to: contact, subject, html, type: "ADMIN_NOTIFICATION", leadId: lead._id, replyTo: lead.email });
  },
  async sendTemplateEmail(args: {
    to: string;
    subject: string;
    bodyHtml: string;
    leadId?: Types.ObjectId | null;
    templateId?: string | null;
    replyTo?: string;
  }): Promise<boolean> {
    const { siteUrl } = emailConfig();
    const html = emailLayout({
      preheader: args.subject,
      eyebrow: "AYNAM",
      titleLines: [args.subject],
      body: args.bodyHtml,
      siteUrl,
    });
    return send({ ...args, html, type: "TEMPLATE_EMAIL" });
  },
};

/** Resolve {{variables}} in a template against a lead; values are escaped. */
export function resolveTemplateVars(
  text: string,
  lead: ILead,
  assignedEmployee = "AYNAM"
): string {
  const vars: Record<string, string> = {
    name: lead.name,
    company: lead.company || "",
    projectType: lead.projectType || "",
    assignedEmployee,
    aynamSiteUrl: emailConfig().siteUrl || "",
    email: lead.email,
  };
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, key: string) =>
    key in vars ? esc(vars[key]) : m
  );
}

export const templateBodyToHtml = (body: string): string =>
  body
    .split(/\r\n|\r|\n/)
    .filter((l) => l.trim() !== "")
    .map((l) => para(l))
    .join("");
