import type { Enquiry } from "../types";
import { emailConfig } from "../transporter";
import {
  detailRows,
  emailLayout,
  solidButton,
  type DetailRow,
} from "./emailLayout";

/**
 * Internal notification sent to AYNAM_CONTACT_EMAIL.
 * Information-dense, premium-internal tone, Reply-To wired to the enquirer.
 */
export function adminNotificationEmail(e: Enquiry): { subject: string; html: string } {
  const { siteUrl } = emailConfig();

  const received = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(e.receivedAt);

  const rows: DetailRow[] = [
    { label: "Name", value: e.name },
    { label: "Email", value: e.email },
  ];
  if (e.phone) rows.push({ label: "Phone", value: e.phone });
  if (e.company) rows.push({ label: "Company", value: e.company });
  if (e.projectType) rows.push({ label: "Project Type", value: e.projectType });
  if (e.budget) rows.push({ label: "Budget", value: e.budget });
  rows.push({ label: "Message", value: e.message, multiline: true });
  rows.push({ label: "Received", value: `${received} IST` });
  rows.push({ label: "Source", value: "AYNAM Website" });

  const body = `
    <p style="margin:0 0 8px; font-family:Helvetica, Arial, sans-serif; font-size:15px; line-height:24px; color:#666666;">
      A new enquiry has been submitted through the AYNAM website.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(0,0,0,0.12); margin-top:16px;">
      ${detailRows(rows)}
    </table>
    <div style="padding-top:16px;">
      ${solidButton(`mailto:${e.email}`, `Reply to ${e.name} →`)}
    </div>`;

  const html = emailLayout({
    preheader: `New enquiry from ${e.name} — ${e.projectType || e.budget || "via aynam website"}`,
    eyebrow: "New project enquiry",
    titleLines: [e.name],
    support: e.email,
    body,
    siteUrl,
  });

  return { subject: `New AYNAM enquiry — ${e.name}`, html };
}
