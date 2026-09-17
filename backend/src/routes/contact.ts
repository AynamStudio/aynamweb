import { Router } from "express";
import { Lead } from "../../lib/server/models/Lead";
import { User } from "../../lib/server/models/User";
import { EmailService } from "../../lib/server/services/emailService";
import { isEmailConfigured } from "../../lib/email/transporter";
import { notify } from "../../lib/server/audit";
import { emitAutomation } from "../../lib/server/services/automation";
import { PROJECT_TYPES, BUDGET_RANGES } from "../../lib/constants";
import { normEmail } from "../../lib/server/services/leads";

export const contactRouter = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\-.\s\d]{7,20}$/;

contactRouter.post("/", async (req, res, next) => {
  try {
    const body = req.body || {};
    // Honeypot — silent accept
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return res.json({ success: true, message: "Your message has been sent." });
    }

    const name = String(body.name || "").trim().replace(/\s+/g, " ");
    const email = String(body.email || "").trim().toLowerCase();
    const company = String(body.company || "").trim();
    const phone = String(body.phone || "").trim();
    const projectType = String(body.projectType || "").trim();
    const budget = String(body.budget || "").trim();
    const message = String(body.message || "").trim();
    const errors: Record<string, string> = {};
    if (name.length < 2 || name.length > 100) errors.name = "Please enter your name (2-100 characters).";
    if (!EMAIL_RE.test(email) || email.length > 254) errors.email = "Please enter a valid email address.";
    if (company.length > 150) errors.company = "Company name is too long.";
    if (phone && !PHONE_RE.test(phone)) errors.phone = "Invalid phone.";
    if (projectType && !(PROJECT_TYPES as readonly string[]).includes(projectType))
      errors.projectType = "Invalid project type.";
    if (budget && !(BUDGET_RANGES as readonly string[]).includes(budget)) errors.budget = "Invalid budget.";
    if (message.length < 10 || message.length > 5000) errors.message = "Message must be 10-5000 chars.";
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: "Please check your input.", errors });
    }

    const emailLower = normEmail(email);
    let lead;
    try {
      lead = await Lead.create({
        name, email, emailLower,
        phone: phone || undefined, company: company || undefined,
        projectType: projectType || undefined, budget: budget || undefined,
        message, source: "WEBSITE", status: "NEW", priority: "MEDIUM", tags: [],
      });
    } catch (e) {
      console.error("[contact] lead persistence failed:", (e as Error).message);
    }

    if (lead) {
      try {
        const admins = await User.find({ role: "ADMIN", status: "ACTIVE" }).limit(5);
        for (const a of admins) await notify(a._id, "lead_created", `New lead: ${lead.name}`, lead.company || lead.email);
      } catch { /* noop */ }
      void emitAutomation("lead.created", lead, null);
    }

    if (!isEmailConfigured()) {
      console.error("[contact] SMTP not configured.");
      return res.status(503).json({ success: false, message: "Email service unavailable." });
    }

    const payload = lead ?? {
      name, email, emailLower, phone, company, projectType, budget, message,
      source: "WEBSITE", status: "NEW", priority: "MEDIUM", tags: [],
      createdAt: new Date(), updatedAt: new Date(),
    };
    // @ts-expect-error minimal shape
    const adminOk = await EmailService.sendAdminNotification(payload);
    if (!adminOk) {
      if (lead) { lead.emailStatus = { admin: "failed" }; await lead.save().catch(() => undefined); }
      return res.status(500).json({ success: false, message: "Couldn't send right now." });
    }
    // @ts-expect-error minimal shape
    const userOk = await EmailService.sendUserConfirmation(payload);
    if (lead) {
      lead.emailStatus = { admin: "sent", user: userOk ? "sent" : "failed" };
      await lead.save().catch(() => undefined);
    }

    return res.json({ success: true, message: "Your message has been sent.", confirmationSent: userOk });
  } catch (e) { next(e); }
});
