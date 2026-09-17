import { Schema, model, models, type Types } from "mongoose";

export interface IActivity {
  _id: Types.ObjectId;
  leadId?: Types.ObjectId | null;
  actorId?: Types.ObjectId | null;
  type: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    type: { type: String, required: true },
    description: { type: String, required: true },
    metadata: { type: Object },
  },
  { timestamps: true }
);
ActivitySchema.index({ createdAt: -1 });

export const Activity = models.Activity || model<IActivity>("Activity", ActivitySchema);
