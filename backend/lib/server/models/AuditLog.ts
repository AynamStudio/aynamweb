import { Schema, model, models, type Types } from "mongoose";

export interface IAuditLog {
  _id: Types.ObjectId;
  actorId?: Types.ObjectId | null;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const AuditSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    resource: { type: String, required: true },
    resourceId: String,
    metadata: { type: Object },
  },
  { timestamps: true }
);
AuditSchema.index({ createdAt: -1 });

export const AuditLog = models.AuditLog || model<IAuditLog>("AuditLog", AuditSchema);
