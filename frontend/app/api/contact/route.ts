import { NextResponse } from "next/server";
import { getTransporter, isEmailConfigured } from "@/lib/email/transporter";
import {
  renderAdminNotification,
  renderUserConfirmation,
} from "@/lib/email/templates/contactEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Frontend-side contact endpoint (runs on Vercel).
 *
 * Strategy (per team brief):
 *  - Validate + honeypot + lightweight in-memory rate limit.
 *  - Send admin notification + user confirmation via Nodemailer SMTP
 *    (Gmail app password or any SMTP server of choice). Vercel outbound
 *    SMTP works; Render's free tier often blocks port 465/587 — which is
 *    why this logic lives on the frontend side.
 *  - If API_URL is configured AND reachable, also forward the
 *    submission to the backend /api/contact so the CRM lead pipeline
 *    (persistence, automations, follow-ups) keeps working. If that proxy
 *    fails we still return success — the user already got their email
 *    through to the studio, which is the P0 requirement.
 *  - When SMTP isn't configured (local dev without credentials) we degrade
 *    gracefully: accept the form, log the payload to server console, and
 *    forward to the backend if present. NEVER silently lose a message.
 */

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_MAX || 5);
const COOLDOWN_MS = Number(process.env.RATE_LIMIT_COOLDOWN_MS || 15 * 1000);
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const log = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  const last = log[log.length - 1];
  if (last && now - last < COOLDOWN_MS) return true;
  if (log.length >= MAX_PER_WINDOW) return true;
  log.push(now);
  hits.set(ip, log);
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

const str = (v: unknown): string => (typeof v === "string" ? v : "");

// Mirror backend constants so this file has no cross-package imports.
const PROJECT_TYPES = [
  "Web & Product Development",
  "AI & Automation",
  "Business Software & Internal Tools",
  "Legacy System Modernization",
  "Other",
];
const BUDGET_RANGES = [
  "Not sure yet",
  "Under ₹50,000",
  "₹50,000 – ₹2,00,000",
  "₹2,00,000 – ₹5,00,000",
  "₹5,00,000+",
];

type Enquiry = {
  name: string;
  email: string;
  company: string;
  phone: string;
  projectType: string;
  budget: string;
  message: string;
};

function validate(raw: Record<string, unknown>): { enquiry: Enquiry | null; errors: Record<string, string> } {
  const name = str(raw.name).trim().replace(/\s+/g, " ");
  const email = str(raw.email).trim().toLowerCase();
  const company = str(raw.company).trim();
  const phone = str(raw.phone).trim();
  const projectType = str(raw.projectType).trim();
  const budget = str(raw.budget).trim();
  const message = str(raw.message).trim();
  const errors: Record<string, string> = {};
  if (name.length < 2 || name.length > 100) errors.name = "Please enter your name (2-100 characters).";
  if (!EMAIL_RE.test(email) || email.length > 254) errors.email = "Please enter a valid email address.";
  if (company.length > 150) errors.company = "Company name is too long (max 150 characters).";
  if (phone && !PHONE_RE.test(phone)) errors.phone = "Phone may contain digits, spaces and + ( ) - only (7-20 chars).";
  if (projectType && !PROJECT_TYPES.includes(projectType)) errors.projectType = "Please pick one of the listed project types.";
  if (budget && !BUDGET_RANGES.includes(budget)) errors.budget = "Please pick one of the listed budget ranges.";
  if (message.length < 10 || message.length > 5000) errors.message = "Message must be between 10 and 5000 characters.";
  if (Object.keys(errors).length > 0) return { enquiry: null, errors };
  return { enquiry: { name, email, company, phone, projectType, budget, message }, errors };
}

async function forwardToBackend(enquiry: Enquiry, website: string, ip: string) {
  const api = (process.env.API_URL || "").replace(/\/+$/, "");
  if (!api) return { ok: false, reason: "no API url" };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(`${api}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": ip,
      },
      body: JSON.stringify({ ...enquiry, website }),
      signal: ctrl.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request) {
  let raw: Record<string, unknown>;
  try {
    const body = await req.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) throw new Error("bad body");
    raw = body as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, message: "Please check the information you entered." },
      { status: 400 }
    );
  }

  // Honeypot — silently accept
  if (str(raw.website).trim() !== "") {
    return NextResponse.json({ success: true, message: "Your message has been sent." });
  }

  const ip =
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { success: false, message: "Too many submissions. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  const { enquiry, errors } = validate(raw);
  if (!enquiry) {
    return NextResponse.json(
      { success: false, message: "Please check the information you entered.", errors },
      { status: 400 }
    );
  }

  // --- EMAIL PATH (SMTP from Vercel) ---
  let smtpOk = false;
  let adminOk = false;
  let userOk = false;
  const transporter = getTransporter();
  if (transporter && isEmailConfigured()) {
    try {
      const admin = renderAdminNotification(enquiry);
      await transporter.sendMail(admin);
      adminOk = true;
      const user = renderUserConfirmation(enquiry);
      await transporter.sendMail(user);
      userOk = true;
      smtpOk = true;
    } catch (e) {
      console.error("[contact] SMTP send failed:", (e as Error).message);
    }
  } else {
    console.info("[contact] SMTP not configured — logging enquiry locally and forwarding to backend.");
    console.info(JSON.stringify(enquiry, null, 2));
  }

  // --- BACKEND PROXY (lead persistence + CRM automations) ---
  const backend = await forwardToBackend(enquiry, str(raw.website), ip);

  if (!smtpOk && !backend.ok) {
    return NextResponse.json(
      { success: false, message: "We couldn't send your message right now. Please try again or email us directly." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Your message has been sent successfully.",
    confirmationSent: userOk,
    note: !smtpOk ? "Message received. We'll be in touch." : undefined,
  });
}
