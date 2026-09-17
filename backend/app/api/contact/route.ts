import { NextResponse } from "next/server";
import { BUDGET_RANGES, PROJECT_TYPES } from "@/lib/constants";
import { isEmailConfigured } from "@/lib/email/transporter";
import { EmailService } from "@/lib/server/services/emailService";
import { Lead, type ILead } from "@/lib/server/models/Lead";
import type { HydratedDocument } from "mongoose";

type LeadDoc = HydratedDocument<ILead>;
import { User } from "@/lib/server/models/User";
import { notify } from "@/lib/server/audit";
import { emitAutomation } from "@/lib/server/services/automation";
import { normEmail } from "@/lib/server/services/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* in-memory rate limit: a few submissions per IP per window           */
/* ------------------------------------------------------------------ */
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
const MAX_PER_WINDOW = Number(process.env.RATE_LIMIT_MAX || 3);
const COOLDOWN_MS = Number(process.env.RATE_LIMIT_COOLDOWN_MS || 20 * 1000);
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

/* ------------------------------------------------------------------ */
/* validation                                                          */
/* ------------------------------------------------------------------ */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

const str = (v: unknown): string => (typeof v === "string" ? v : "");

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
  if (projectType && !(PROJECT_TYPES as readonly string[]).includes(projectType)) errors.projectType = "Please pick one of the listed project types.";
  if (budget && !(BUDGET_RANGES as readonly string[]).includes(budget)) errors.budget = "Please pick one of the listed budget ranges.";
  if (message.length < 10 || message.length > 5000) errors.message = "Message must be between 10 and 5000 characters.";

  if (Object.keys(errors).length > 0) return { enquiry: null, errors };
  return { enquiry: { name, email, company, phone, projectType, budget, message }, errors };
}

/* ------------------------------------------------------------------ */
/* POST /api/contact                                                   */
/*  validate → sanitize → spam checks → MongoDB lead → SMTP → success */
/* ------------------------------------------------------------------ */
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

  /* honeypot: bots fill the hidden "website" field — silently accept, send nothing */
  if (str(raw.website).trim() !== "") {
    return NextResponse.json({ success: true, message: "Your message has been sent successfully." });
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

  /* 1 — persist the lead FIRST: it must survive SMTP outages */
  let lead: LeadDoc | null = null;
  try {
    lead = await Lead.create({
      name: enquiry.name,
      email: enquiry.email,
      emailLower: normEmail(enquiry.email),
      phone: enquiry.phone || undefined,
      company: enquiry.company || undefined,
      projectType: enquiry.projectType || undefined,
      budget: enquiry.budget || undefined,
      message: enquiry.message,
      source: "WEBSITE",
    });
  } catch (e) {
    console.error("[contact] lead persistence failed:", (e as Error).message);
  }

  /* dashboard notifications + automation hooks (non-fatal) */
  if (lead) {
    try {
      const admins = await User.find({ role: "ADMIN", status: "ACTIVE" }).limit(5);
      for (const a of admins) await notify(a._id, "lead_created", `New lead: ${lead.name}`, lead.company || lead.email);
    } catch {
      /* non-fatal */
    }
    void emitAutomation("lead.created", lead, null);
  }

  const payload: ILead = (lead ?? {
    ...enquiry,
    emailLower: normEmail(enquiry.email),
    source: "WEBSITE",
    status: "NEW",
    priority: "MEDIUM",
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as ILead;

  if (!isEmailConfigured()) {
    console.error("[contact] SMTP environment is not configured");
    return NextResponse.json(
      { success: false, message: "We couldn't send your message right now. Please try again." },
      { status: 500 }
    );
  }

  /* 2 — admin notification (business-critical), 3 — user confirmation */
  const adminOk = await EmailService.sendAdminNotification(payload);
  if (!adminOk) {
    if (lead) {
      lead.emailStatus = { admin: "failed" };
      await lead.save().catch(() => undefined);
    }
    return NextResponse.json(
      { success: false, message: "We couldn't send your message right now. Please try again." },
      { status: 500 }
    );
  }
  const userOk = await EmailService.sendUserConfirmation(payload);
  if (lead) {
    lead.emailStatus = { admin: "sent", user: userOk ? "sent" : "failed" };
    await lead.save().catch(() => undefined);
  }
  if (!userOk) {
    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully.",
      confirmationSent: false,
    });
  }

  return NextResponse.json({ success: true, message: "Your message has been sent successfully." });
}
