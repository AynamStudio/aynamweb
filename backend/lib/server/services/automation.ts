import { Automation, type IAutomationAction } from "../models/Automation";
import { Lead, type ILead } from "../models/Lead";
import type { HydratedDocument } from "mongoose";

type LeadDoc = HydratedDocument<ILead>;
import { User } from "../models/User";
import { activity, notify } from "../audit";
import { EmailService, resolveTemplateVars, templateBodyToHtml } from "./emailService";
import { EmailTemplate } from "../models/EmailTemplate";
import type { Types } from "mongoose";

export type AutomationEvent = "lead.created" | "lead.assigned" | "lead.status_changed" | "lead.followup_due" | "lead.imported";

function conditionsMatch(conditions: { field: string; op: string; value: string }[], lead: ILead): boolean {
  return conditions.every((c) => {
    const actual = String((lead as unknown as Record<string, unknown>)[c.field] ?? "");
    return c.op === "neq" ? actual !== c.value : actual === c.value;
  });
}

async function runAction(action: IAutomationAction, lead: LeadDoc, actorId: Types.ObjectId | null): Promise<void> {
  switch (action.type) {
    case "send_email": {
      const tpl = action.templateId ? await EmailTemplate.findById(action.templateId) : null;
      if (!tpl) return;
      const assigned = lead.assignedTo ? await User.findById(lead.assignedTo) : null;
      const subject = resolveTemplateVars(tpl.subject, lead, assigned?.name || "AYNAM");
      const body = templateBodyToHtml(resolveTemplateVars(tpl.html, lead, assigned?.name || "AYNAM"));
      await EmailService.sendTemplateEmail({
        to: lead.email,
        subject,
        bodyHtml: body,
        leadId: lead._id,
        templateId: String(tpl._id),
      });
      await activity(lead._id, actorId, "email_sent", `Automation email sent: ${tpl.name}`);
      return;
    }
    case "notify_employee": {
      const target = lead.assignedTo || (await User.findOne({ role: "ADMIN" }))?._id;
      if (target) await notify(target, "automation", `Automation: ${action.description || "action executed"}`, lead.name);
      return;
    }
    case "create_activity":
      await activity(lead._id, actorId, "automation", action.description || "Automation executed");
      return;
    case "change_status": {
      if (!action.status) return;
      const prev = lead.status;
      lead.status = action.status as ILead["status"];
      await lead.save();
      await activity(lead._id, actorId, "status_changed", `Automation changed status ${prev} → ${action.status}`);
      return;
    }
    case "assign_lead": {
      if (!action.userId) return;
      lead.assignedTo = action.userId as unknown as Types.ObjectId;
      lead.assignedAt = new Date();
      await lead.save();
      await activity(lead._id, actorId, "assigned", "Automation assigned the lead");
      return;
    }
  }
}

/**
 * Minimal, extensible automation runner: trigger → conditions → actions.
 * Extension point for future integrations (webhooks, CRM sync, AI…).
 */
export async function emitAutomation(event: AutomationEvent, lead: LeadDoc, actorId: Types.ObjectId | null = null): Promise<void> {
  try {
    const automations = await Automation.find({ enabled: true, trigger: event });
    for (const a of automations) {
      if (!conditionsMatch(a.conditions, lead)) continue;
      for (const action of a.actions) {
        await runAction(action, lead, actorId);
      }
    }
  } catch (e) {
    console.error("[automation] failed:", (e as Error).message);
  }
}

export async function seedDefaultAutomations(adminId: Types.ObjectId | null): Promise<void> {
  if ((await Automation.countDocuments()) > 0) return;
  await Automation.insertMany([
    {
      name: "Assignment notification",
      description: "Notify the employee when a lead is assigned to them.",
      enabled: true,
      trigger: "lead.assigned",
      conditions: [],
      actions: [
        { type: "notify_employee", description: "A new lead was assigned to you" },
        { type: "create_activity", description: "Assignment notification sent" },
      ],
      createdBy: adminId,
    },
    {
      name: "Follow-up reminder",
      description: "Create a notification when a lead's follow-up date arrives.",
      enabled: true,
      trigger: "lead.followup_due",
      conditions: [],
      actions: [{ type: "notify_employee", description: "Follow-up due on an assigned lead" }],
      createdBy: adminId,
    },
  ]);
}
