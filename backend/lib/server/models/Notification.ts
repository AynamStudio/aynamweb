import { Schema, model, models, type Types } from "mongoose";

export interface INotification {
  _id: Types.ObjectId;
  recipientId: Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
NotificationSchema.index({ createdAt: -1 });

export const Notification = models.Notification || model<INotification>("Notification", NotificationSchema);
