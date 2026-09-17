import mongoose from "mongoose";
import { z } from "zod";
import { User } from "@/lib/server/models/User";
import { badRequest, forbidden, notFound, ok, parseBody, requireUser } from "@/lib/server/guards";
import { employeePatchSchema } from "@/lib/server/validators";
import { hashPassword } from "@/lib/server/auth";
import { audit } from "@/lib/server/audit";
import crypto from "crypto";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("employees.edit");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const target = await User.findById(id);
  if (!target) return notFound();
  const { data, res: bad } = await parseBody<z.infer<typeof employeePatchSchema>>(req, employeePatchSchema);
  if (bad) return bad;

  const disabling = data.status === "DISABLED" && target.status !== "DISABLED";
  if (disabling) {
    const { res: denied } = await requireUser("employees.disable");
    if (denied) return denied;
  }
  if (target.role === "ADMIN" && String(target._id) !== String(user._id)) {
    if (disabling || data.role !== undefined) {
      const admins = await User.countDocuments({ role: "ADMIN", status: "ACTIVE" });
      if (admins <= 1) return badRequest("At least one active admin is required.");
    }
  }
  let tempPassword: string | null = null;
  if (data.resetPassword) {
    tempPassword = crypto.randomBytes(9).toString("base64url");
    target.passwordHash = await hashPassword(tempPassword);
    target.status = "INVITED";
  }
  for (const f of ["name", "phone", "department", "role", "status", "permissions"] as const) {
    if (data[f] !== undefined) (target as unknown as Record<string, unknown>)[f] = data[f];
  }
  await target.save();
  await audit(user._id, data.resetPassword ? "employee.reset_access" : "employee.update", "user", String(target._id), {
    fields: Object.keys(data),
  });
  return ok({ id: String(target._id), temporaryPassword: tempPassword });
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { user, res } = await requireUser("employees.disable");
  if (res) return res;
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return notFound();
  const target = await User.findById(id);
  if (!target) return notFound();
  if (String(target._id) === String(user._id)) return badRequest("You cannot disable your own account.");
  target.status = "DISABLED";
  await target.save();
  await audit(user._id, "employee.disable", "user", String(target._id));
  return ok({ disabled: true });
}
