import mongoose from "mongoose";
import { z } from "zod";
import { Lead } from "@/lib/server/models/Lead";
import { Note } from "@/lib/server/models/Note";
import { notFound, ok, parseBody, requireUser } from "@/lib/server/guards";
import { noteSchema } from "@/lib/server/validators";
import { leadScopeFilter } from "@/lib/server/services/leads";
import { activity } from "@/lib/server/audit";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("leads.edit");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const lead = await Lead.findOne({ _id: id, deletedAt: null, ...leadScopeFilter(user) });
  if (!lead) return notFound();
  const { data, res: bad } = await parseBody<z.infer<typeof noteSchema>>(req, noteSchema);
  if (bad) return bad;
  const note = await Note.create({ leadId: lead._id, authorId: user._id, body: data.body });
  await activity(lead._id, user._id, "note_added", `Note added by ${user.name}`);
  return ok({ id: String(note._id) }, { status: 201 });
}
