import { Schema, model, models, type Types } from "mongoose";

export const TEMPLATE_CATEGORIES = ["CONTACT_CONFIRMATION", "FOLLOW_UP", "PROPOSAL", "GENERAL", "WELCOME", "INTERNAL"] as const;

export interface IEmailTemplate {
  _id: Types.ObjectId;
  name: string;
  subject: string;
  html: string;
  category: (typeof TEMPLATE_CATEGORIES)[number];
  status: "DRAFT" | "ACTIVE";
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    html: { type: String, required: true },
    category: { type: String, enum: TEMPLATE_CATEGORIES, default: "GENERAL" },
    status: { type: String, enum: ["DRAFT", "ACTIVE"], default: "ACTIVE" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const EmailTemplate = models.EmailTemplate || model<IEmailTemplate>("EmailTemplate", TemplateSchema);
