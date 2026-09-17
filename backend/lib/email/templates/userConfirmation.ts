import type { Enquiry } from "../types";
import { bannerUrl, emailConfig } from "../transporter";
import {
  detailRows,
  emailLayout,
  outlineButton,
  para,
  sectionLabel,
  type DetailRow,
} from "./emailLayout";

/**
 * Confirmation email sent to the person who submitted the enquiry.
 * Carries the hosted AYNAM banner at the top of the card.
 */
export function userConfirmationEmail(e: Enquiry): { subject: string; html: string } {
  const { siteUrl } = emailConfig();

  const rows: DetailRow[] = [
    { label: "Name", value: e.name },
    { label: "Email", value: e.email },
  ];
  if (e.company) rows.push({ label: "Company", value: e.company });
  if (e.phone) rows.push({ label: "Phone", value: e.phone });
  if (e.projectType) rows.push({ label: "Project", value: e.projectType });
  if (e.budget) rows.push({ label: "Budget", value: e.budget });
  rows.push({ label: "Message", value: e.message, multiline: true });

  const body = `
    ${para(`Hi ${e.name},`)}
    ${para("Thank you for contacting AYNAM and sharing the details of your project with us.")}
    ${para("We've received your enquiry and our team will review the information you've shared.")}
    ${para("We'll get back to you soon to discuss your requirements and the next steps.")}
    ${sectionLabel("Your enquiry")}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-top:1px solid rgba(0,0,0,0.12); margin-top:8px;">
      ${detailRows(rows)}
    </table>
    ${para("We look forward to learning more about what you're building.")}
    <div style="padding-top:12px;">
      ${outlineButton(siteUrl || "https://aynam.studio", "Return to AYNAM →")}
    </div>`;

  const html = emailLayout({
    bannerUrl: bannerUrl(),
    preheader: "We've received your message — our team will get back to you soon.",
    eyebrow: "Message received",
    titleLines: ["Thanks for", "reaching out."],
    support: "We've received your message and the details you shared. Our team will review it and get back to you soon.",
    body,
    siteUrl,
  });

  return { subject: "AYNAM — We've received your message", html };
}
