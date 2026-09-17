import { bannerUrl, emailConfig, fromAddress } from "@/lib/email/transporter";
import { detailRows, emailLayout, esc, para, sectionLabel, solidButton } from "./emailLayout";

type LeadLike = {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  projectType?: string;
  budget?: string;
  message: string;
};

/**
 * Notification sent to AYNAM's internal inbox when a new enquiry lands.
 * Text-only for the studio; contains the full enquiry payload + reply-to set
 * to the enquirer so hitting reply starts the thread correctly.
 */
export function renderAdminNotification(lead: LeadLike): {
  to: string;
  from: string;
  replyTo: string;
  subject: string;
  html: string;
} {
  const c = emailConfig();
  const b = bannerUrl();
  const siteUrl = c.siteUrl;
  const crmUrl = (process.env.AYNAM_CRM_URL || "").replace(/\/+$/, "");

  const subject = `New enquiry from ${lead.name}${lead.company ? ` · ${lead.company}` : ""}`;

  const body = `
    ${para(`${lead.name} submitted a new project enquiry via aynam.in.`)}
    ${sectionLabel("Enquiry details")}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${detailRows([
        { label: "Name", value: lead.name },
        { label: "Email", value: lead.email },
        ...(lead.company ? [{ label: "Company", value: lead.company }] : []),
        ...(lead.phone ? [{ label: "Phone", value: lead.phone }] : []),
        ...(lead.projectType ? [{ label: "Project type", value: lead.projectType }] : []),
        ...(lead.budget ? [{ label: "Budget", value: lead.budget }] : []),
        { label: "Message", value: lead.message, multiline: true },
      ])}
    </table>
    ${crmUrl ? `
      <p style="margin:36px 0 12px;">
        ${solidButton(`${crmUrl}/leads`, "Open in CRM")}
      </p>
      <p style="margin:72px 0 0; font-size:0; line-height:0;">&nbsp;</p>
    ` : ""}
    <p style="margin:24px 0 0; font-family:Helvetica,Arial,sans-serif; font-size:12px; color:#999;">
      Reply directly to this email to respond to ${esc(lead.name)}.
    </p>
  `;

  return {
    to: c.contact,
    from: fromAddress(),
    replyTo: lead.email,
    subject,
    html: emailLayout({
      bannerUrl: b,
      preheader: `New project enquiry from ${lead.name} — ${lead.projectType || "general enquiry"}`,
      eyebrow: "New Enquiry",
      titleLines: [lead.name, "wants to talk."],
      support: lead.company ? lead.company : undefined,
      body,
      siteUrl,
    }),
  };
}

/**
 * Confirmation email back to the enquirer — assures them the message landed
 * and sets expectations on response time. Branded with the banner/logo.
 */
export function renderUserConfirmation(lead: { name: string; email: string }): {
  to: string;
  from: string;
  subject: string;
  html: string;
} {
  const c = emailConfig();
  const b = bannerUrl();
  const siteUrl = c.siteUrl;
  const firstName = lead.name.trim().split(/\s+/)[0] || lead.name.trim();

  const body = `
    ${para(`Hi ${firstName},`)}
    ${para("Thanks for reaching out to AYNAM. Your message has landed with the studio and we'll be in touch shortly — usually within one business day.")}
    ${para("If your project is time-sensitive, a quick reply to this email with any additional context helps us move faster.")}
    <p style="margin:36px 0 8px;">
      ${solidButton(siteUrl, "Visit AYNAM")}
    </p>
    <p style="margin:64px 0 0; font-size:0; line-height:0;">&nbsp;</p>
    <p style="margin:0; font-family:Helvetica,Arial,sans-serif; font-size:13px; line-height:22px; color:#666;">
      — The AYNAM team<br />
      Independent software studio.
    </p>
  `;

  return {
    to: lead.email,
    from: fromAddress(),
    subject: "Thanks for reaching out — AYNAM",
    html: emailLayout({
      bannerUrl: b,
      preheader: "We've received your message and will be in touch shortly.",
      eyebrow: "Message Received",
      titleLines: ["We'll be in", "touch soon."],
      support: `Thanks, ${firstName}.`,
      body,
      siteUrl,
    }),
  };
}
