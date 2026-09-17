import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Frontend-side (Next.js Route Handler) Nodemailer transporter.
 *
 * IMPORTANT: this module runs on the SERVER only — never import it from a
 * client component. It is loaded by app/api/contact/route.ts exclusively.
 *
 * Why two sides:
 *  - Vercel-hosted `frontend` can reach Gmail SMTP outbound (port 465/587 open)
 *    → this file covers that path (the "frontend SMTP" the team asked for).
 *  - Render-hosted `backend` will use Resend for production (SMTP ports often
 *    blocked on the free tier); the backend CRM API stays responsible for
 *    lead persistence, automations and dashboards.
 *
 * SMTP env vars are read on the server only; none leak to the browser.
 */

let cached: Transporter | null = null;
let verified = false;

export function emailConfig() {
  return {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE ?? "true") !== "false",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
    // where incoming enquiries land
    contact: process.env.AYNAM_CONTACT_EMAIL || process.env.SMTP_USER || "",
    // canonical site origin used inside emails + CTA links
    siteUrl: (process.env.AYNAM_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://aynam.in").replace(/\/+$/, ""),
    // public asset origin — email clients need absolute https URLs
    // default: images subdomain per request (crm.images.aynam.in / images.aynam.in)
    assetsUrl: (
      process.env.AYNAM_ASSETS_URL ||
      process.env.NEXT_PUBLIC_ASSETS_URL ||
      ""
    ).replace(/\/+$/, ""),
  };
}

export function isEmailConfigured(): boolean {
  const c = emailConfig();
  return Boolean(c.host && c.port && c.user && c.pass && c.contact);
}

/** "AYNAM <smtp-user>" — never derived from user input. */
export function fromAddress(): string {
  const c = emailConfig();
  return `AYNAM <${c.user}>`;
}

/**
 * Absolute HTTPS URL of the branded email banner.
 *
 * Email clients CANNOT resolve relative URLs or localhost, so this always
 * returns an absolute https:// URL pointing at the public assets origin
 * (images.aynam.in by convention — falls back to siteUrl/images/…).
 * Banner file itself lives in /public/images/email-banner.png so Vercel
 * serves it both at the site origin and (via DNS + a rewrite/CDN) at the
 * dedicated image subdomain.
 */
export function bannerUrl(): string {
  const c = emailConfig();
  if (process.env.AYNAM_EMAIL_BANNER_URL) return process.env.AYNAM_EMAIL_BANNER_URL;
  const origin = c.assetsUrl || c.siteUrl;
  if (!origin) return "";
  return `${origin}/images/email-banner.png`;
}

export function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (!cached) {
    const c = emailConfig();
    cached = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.secure,
      auth: { user: c.user, pass: c.pass },
      // Vercel serverless friendly: don't hold pooled connections
      pool: false,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 15000,
      logger: false,
      debug: false,
    });
    if (process.env.NODE_ENV !== "production" && !verified) {
      verified = true;
      cached.verify().catch((err: Error) => {
        console.error("[frontend-email] transporter verify failed:", err.message);
      });
    }
  }
  return cached;
}
