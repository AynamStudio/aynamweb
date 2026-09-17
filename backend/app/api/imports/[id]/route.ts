import mongoose from "mongoose";
import { ImportJob } from "@/lib/server/models/ImportJob";
import { notFound, ok, requireUser } from "@/lib/server/guards";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("leads.import");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const job = id === "errors" ? null : await ImportJob.findById(id);
  if (!job) return notFound();
  return ok({ ...job.toObject(), uploadedBy: String(job.uploadedBy) });
}
