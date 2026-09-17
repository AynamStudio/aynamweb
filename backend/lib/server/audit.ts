import { AuditLog } from "./models/AuditLog";
import { Activity } from "./models/Activity";
import { Notification } from "./models/Notification";
import type { Types } from "mongoose";

/** Administrative audit trail — append-only, never editable via API. */
export async function audit(
  actorId: Types.ObjectId | null,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await AuditLog.create({ actorId, action, resource, resourceId, metadata });
  } catch (e) {
    console.error("[audit] failed:", (e as Error).message);
  }
}

/** Lead activity timeline entry. */
export async function activity(
  leadId: Types.ObjectId | null,
  actorId: Types.ObjectId | null,
  type: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await Activity.create({ leadId, actorId, type, description, metadata });
  } catch (e) {
    console.error("[activity] failed:", (e as Error).message);
  }
}

export async function notify(
  recipientId: Types.ObjectId,
  type: string,
  title: string,
  message = ""
): Promise<void> {
  try {
    await Notification.create({ recipientId, type, title, message });
  } catch (e) {
    console.error("[notify] failed:", (e as Error).message);
  }
}
