import { Notification } from "@/lib/server/models/Notification";
import { ok, requireUser } from "@/lib/server/guards";

export async function GET() {
  const { user, res } = await requireUser();
  if (res) return res;
  const items = await Notification.find({ recipientId: user._id }).sort({ createdAt: -1 }).limit(50);
  return ok({
    items: items.map((n) => ({ id: String(n._id), type: n.type, title: n.title, message: n.message, read: n.read, createdAt: n.createdAt })),
    unread: items.filter((n) => !n.read).length,
  });
}
