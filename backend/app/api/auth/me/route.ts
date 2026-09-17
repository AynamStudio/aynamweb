import { getSessionUser } from "@/lib/server/auth";
import { ok, unauthorized } from "@/lib/server/guards";
import { ensureBootstrap } from "@/lib/server/db";

export async function GET() {
  await ensureBootstrap();
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return ok({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department || "",
    permissions: user.permissions,
  });
}
