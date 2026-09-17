import { Schema, model, models, type Types } from "mongoose";

export const AUTOMATION_TRIGGERS = ["lead.created", "lead.assigned", "lead.status_changed", "lead.followup_due", "lead.imported"] as const;

export interface IAutomationAction {
  type: "send_email" | "assign_lead" | "change_status" | "create_activity" | "notify_employee";
  templateId?: string;
  status?: string;
  userId?: string;
  description?: string;
}

export interface IAutomation {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  enabled: boolean;
  trigger: (typeof AUTOMATION_TRIGGERS)[number];
  conditions: { field: string; op: "eq" | "neq"; value: string }[];
  actions: IAutomationAction[];
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AutomationSchema = new Schema<IAutomation>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    enabled: { type: Boolean, default: true },
    trigger: { type: String, enum: AUTOMATION_TRIGGERS, required: true },
    conditions: { type: [{ field: String, op: String, value: String }], default: [] },
    actions: { type: [Object], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const Automation = models.Automation || model<IAutomation>("Automation", AutomationSchema);
