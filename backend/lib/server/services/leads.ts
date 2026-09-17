import type { QueryFilter } from "mongoose";
import type { ILead, LeadStatus, LeadPriority } from "../models/Lead";
import { LEAD_STATUSES, LEAD_PRIORITIES } from "../models/Lead";
import type { IUser } from "../models/User";
import { hasPerm } from "../permissions";

/** Backend-enforced visibility: admins / leads.view_all see everything. */
export function leadScopeFilter(user: IUser): QueryFilter<ILead> {
  if (user.role === "ADMIN" || hasPerm(user, "leads.view_all")) return {};
  return { assignedTo: user._id };
}

export const isStatus = (v: unknown): v is LeadStatus =>
  typeof v === "string" && (LEAD_STATUSES as readonly string[]).includes(v);
export const isPriority = (v: unknown): v is LeadPriority =>
  typeof v === "string" && (LEAD_PRIORITIES as readonly string[]).includes(v);

export const normEmail = (v: string): string => v.trim().toLowerCase();

export const escapeRegExp = (v: string): string => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
