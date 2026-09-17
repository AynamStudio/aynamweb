import { Schema, model, models, type Types } from "mongoose";

export interface IEmailLog {
  _id: Types.ObjectId;
  leadId?: Types.ObjectId | null;
  recipient: string;
  subject: string;
  templateId?: string | null;
  type: string;
  status: "SENT" | "FAILED";
  errorCode?: string;
  sentAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>({
  leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  templateId: { type: String, default: null },
  type: { type: String, required: true },
  status: { type: String, enum: ["SENT", "FAILED"], required: true },
  errorCode: String,
  sentAt: { type: Date, default: Date.now },
});

export const EmailLog = models.EmailLog || model<IEmailLog>("EmailLog", EmailLogSchema);
