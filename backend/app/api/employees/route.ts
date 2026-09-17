import { z } from "zod";
import { User } from "@/lib/server/models/User";
import { badRequest, ok, parseBody, requireUser } from "@/lib/server/guards";
import { employeeCreateSchema } from "@/lib/server/validators";
import { hashPassword } from "@/lib/server/auth";
import { ROLE_PRESETS } from "@/lib/server/permissions";
import { audit } from "@/lib/server/audit";
import crypto from "crypto";

export async function GET() {
  const { user, res } = await requireUser("employees.view");
  if (res) return res;
  const users = await User.find().sort({ createdAt: 1 });
  return ok({
    items: users.map((u) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      phone: u.phone || "",
      role: u.role,
      department: u.department || "",
      status: u.status,
      permissions: u.permissions,
      lastLoginAt: u.lastLoginAt || null,
      createdAt: u.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  const { user, res } = await requireUser("employees.create");
  if (res) return res;
  const { data, res: bad } = await parseBody<z.infer<typeof employeeCreateSchema>>(req, employeeCreateSchema);
  if (bad) return bad;
  if (await User.findOne({ email: data.email.toLowerCase() })) return badRequest("An account with this email already exists.");
  const tempPassword = crypto.randomBytes(9).toString("base64url");
  const created = await User.create({
    name: data.name,
    email: data.email,
    phone: data.phone || "",
    role: data.role,
    department: data.department || "",
    status: "INVITED",
    permissions: data.permissions && data.permissions.length ? data.permissions : ROLE_PRESETS[data.role],
    passwordHash: await hashPassword(tempPassword),
  });
  await audit(user._id, "employee.create", "user", String(created._id), { role: created.role });
  /* temporary password returned once — share via a secure channel */
  return ok({ id: String(created._id), temporaryPassword: tempPassword }, { status: 201 });
}
