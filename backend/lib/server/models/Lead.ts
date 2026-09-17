import { Schema, model, models, type Types } from "mongoose";

export const LEAD_SOURCES = ["WEBSITE", "CSV_IMPORT", "EXCEL_IMPORT", "MANUAL"] as const;
export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ON_HOLD"] as const;
export const LEAD_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export interface ILead {
  _id: Types.ObjectId;
  name: string;
  email: string;
  emailLower: string;
  phone?: string;
  company?: string;
  projectType?: string;
  budget?: string;
  message?: string;
  source: LeadSource;
  status: LeadStatus;
  priority: LeadPriority;
  assignedTo?: Types.ObjectId | null;
  assignedAt?: Date;
  assignedBy?: Types.ObjectId | null;
  tags: string[];
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
  followUpNotifiedAt?: Date;
  emailStatus?: { admin?: "sent" | "failed"; user?: "sent" | "failed" };
  /* future-ready, never fabricated today */
  leadScore?: number;
  qualification?: string;
  intent?: string;
  summary?: string;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    emailLower: { type: String, required: true, index: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true },
    projectType: { type: String, trim: true },
    budget: { type: String, trim: true },
    message: { type: String },
    source: { type: String, enum: LEAD_SOURCES, default: "MANUAL", index: true },
    status: { type: String, enum: LEAD_STATUSES, default: "NEW", index: true },
    priority: { type: String, enum: LEAD_PRIORITIES, default: "MEDIUM" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    assignedAt: Date,
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    tags: { type: [String], default: [] },
    lastContactedAt: Date,
    nextFollowUpAt: { type: Date, index: true },
    followUpNotifiedAt: Date,
    emailStatus: {
      admin: { type: String, enum: ["sent", "failed"] },
      user: { type: String, enum: ["sent", "failed"] },
    },
    leadScore: Number,
    qualification: String,
    intent: String,
    summary: String,
    deletedAt: { type: Date, default: null },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);
LeadSchema.index({ createdAt: -1 });
LeadSchema.index({ name: "text", email: "text", company: "text" });

export const Lead = models.Lead || model<ILead>("Lead", LeadSchema);
