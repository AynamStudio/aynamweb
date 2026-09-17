import { z } from "zod";
import { PERMISSIONS, ROLES } from "./permissions";
import { LEAD_PRIORITIES, LEAD_STATUSES } from "./models/Lead";

export const loginSchema = z.object({
  email: z.string().min(3).max(254),
  password: z.string().min(1).max(200),
});

export const leadCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().min(3).max(254),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  company: z.string().trim().max(150).optional().or(z.literal("")),
  projectType: z.string().trim().max(150).optional().or(z.literal("")),
  budget: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
  status: z.enum(LEAD_STATUSES).optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
});

export const leadPatchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  company: z.string().trim().max(150).optional(),
  projectType: z.string().trim().max(150).optional(),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().max(5000).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  priority: z.enum(LEAD_PRIORITIES).optional(),
  tags: z.array(z.string().trim().max(40)).max(20).optional(),
  nextFollowUpAt: z.string().nullable().optional(),
  lastContactedAt: z.string().nullable().optional(),
});

export const assignSchema = z.object({ assignedTo: z.string().min(1).nullable() });
export const noteSchema = z.object({ body: z.string().trim().min(1).max(5000) });
export const leadEmailSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(20000),
  templateId: z.string().min(1).optional(),
});
export const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
  action: z.enum(["assign", "status", "priority", "tag"]),
  value: z.string().max(200),
});

export const employeeCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().min(3).max(254),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  role: z.enum(ROLES),
  department: z.string().trim().max(100).optional().or(z.literal("")),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
});
export const employeePatchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  department: z.string().trim().max(100).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(["ACTIVE", "DISABLED", "INVITED"]).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).optional(),
  resetPassword: z.boolean().optional(),
});

export const templateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  html: z.string().min(1).max(50000),
  category: z.enum(["CONTACT_CONFIRMATION", "FOLLOW_UP", "PROPOSAL", "GENERAL", "WELCOME", "INTERNAL"]),
  status: z.enum(["DRAFT", "ACTIVE"]).optional(),
});
export const templatePatchSchema = templateSchema.partial();

export const automationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  enabled: z.boolean().optional(),
  trigger: z.enum(["lead.created", "lead.assigned", "lead.status_changed", "lead.followup_due", "lead.imported"]),
  conditions: z.array(z.object({ field: z.string().max(60), op: z.enum(["eq", "neq"]), value: z.string().max(120) })).max(10).optional(),
  actions: z.array(z.object({
    type: z.enum(["send_email", "assign_lead", "change_status", "create_activity", "notify_employee"]),
    templateId: z.string().max(60).optional(),
    status: z.string().max(40).optional(),
    userId: z.string().max(60).optional(),
    description: z.string().max(300).optional(),
  })).min(1).max(10),
});
export const automationPatchSchema = automationSchema.partial();

export const settingsSchema = z.object({
  businessName: z.string().trim().max(100).optional(),
  websiteUrl: z.string().trim().max(200).optional(),
  contactEmail: z.string().trim().max(254).optional(),
  defaultLeadStatus: z.enum(LEAD_STATUSES).optional(),
  defaultLeadPriority: z.enum(LEAD_PRIORITIES).optional(),
  timezone: z.string().trim().max(80).optional(),
});

/** strip any script/event-handler content from stored template HTML */
export const sanitizeTemplateHtml = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<script[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
