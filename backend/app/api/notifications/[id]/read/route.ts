import mongoose from "mongoose";
import { Notification } from "@/lib/server/models/Notification";
import { notFound, ok, requireUser } from "@/lib/server/guards";

export async function PATCH(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser();
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const n = await Notification.findOne({ _id: id, recipientId: user._id });
  if (!n) return notFound();
  n.read = true;
  await n.save();
  return ok({ id });
}
