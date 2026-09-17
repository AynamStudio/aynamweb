import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

/**
 * Single reusable Nodemailer transporter (Gmail SMTP via App Password).
 *
 * All credentials come from environment variables — server-side only.
 * Nothing here is ever imported by client components, and no value from
 * this module is included in API responses, logs or rendered HTML.
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
    contact: process.env.AYNAM_CONTACT_EMAIL || process.env.SMTP_USER || "",
    siteUrl: (process.env.AYNAM_SITE_URL || "").replace(/\/+$/, ""),
    assetsUrl: (process.env.AYNAM_ASSETS_URL || "").replace(/\/+$/, ""),
    logoUrl: process.env.AYNAM_LOGO_URL || "",
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
 * Absolute HTTPS URL of the branded banner shown at the top of user emails.
 * Override with AYNAM_EMAIL_BANNER_URL; otherwise derived from AYNAM_SITE_URL
 * (the banner ships in /public). Empty string → clean text wordmark fallback.
 */
export function bannerUrl(): string {
  const { siteUrl, assetsUrl, logoUrl } = emailConfig();
  const origin = assetsUrl || siteUrl;
  return (
    process.env.AYNAM_EMAIL_BANNER_URL ||
    (origin ? `${origin}/images/email-banner.png` : "") ||
    logoUrl
  );
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
      logger: false,
      debug: false,
    });
    /* one-off config check in development only — never per request */
    if (process.env.NODE_ENV !== "production" && !verified) {
      verified = true;
      cached.verify().catch((err: Error) => {
        console.error("[email] transporter verify failed:", err.message);
      });
    }
  }
  return cached;
}
