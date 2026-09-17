import { Schema, model, models } from "mongoose";

export interface ISetting {
  _id: unknown;
  key: string;
  businessName: string;
  websiteUrl: string;
  contactEmail: string;
  defaultLeadStatus: string;
  defaultLeadPriority: string;
  timezone: string;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, unique: true, default: "primary" },
    businessName: { type: String, default: "AYNAM" },
    websiteUrl: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    defaultLeadStatus: { type: String, default: "NEW" },
    defaultLeadPriority: { type: String, default: "MEDIUM" },
    timezone: { type: String, default: "Asia/Kolkata" },
  },
  { timestamps: true }
);

export const Setting = models.Setting || model<ISetting>("Setting", SettingSchema);
