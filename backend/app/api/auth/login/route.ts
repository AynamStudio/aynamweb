import { NextResponse } from "next/server";
import { z } from "zod";
import { User } from "@/lib/server/models/User";
import { COOKIE_NAME, cookieOptions, hashPassword, signToken, verifyPassword } from "@/lib/server/auth";
import { badRequest, err, ok, parseBody, unauthorized } from "@/lib/server/guards";
import { loginSchema } from "@/lib/server/validators";
import { ensureBootstrap } from "@/lib/server/db";
import { audit } from "@/lib/server/audit";
import { ALL_PERMISSIONS } from "@/lib/server/permissions";

const attempts = new Map<string, number[]>();
const LOGIN_WINDOW_MS = Number(process.env.LOGIN_RATE_WINDOW_MS || 10 * 60_000);
const LOGIN_MAX = Number(process.env.LOGIN_RATE_MAX || 6);
function limited(key: string): boolean {
  const now = Date.now();
  const log = (attempts.get(key) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  if (log.length >= LOGIN_MAX) return true;
  log.push(now);
  attempts.set(key, log);
  return false;
}

export async function POST(req: Request) {
  await ensureBootstrap();
  const { data, res } = await parseBody<z.infer<typeof loginSchema>>(req, loginSchema);
  if (res) return res;
  const email = data.email.toLowerCase().trim();
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  if (limited(ip) || limited(`email:${email}`)) {
    return err(429, "Too many attempts. Please try again later.", "RATE_LIMITED");
  }
  const user = await User.findOne({ email });
  if (!user || user.status === "DISABLED" || !(await verifyPassword(data.password, user.passwordHash))) {
    return unauthorized();
  }
  if (user.status === "INVITED") {
    /* first login with the one-time temporary password activates the account */
    user.status = "ACTIVE";
  }
  if (user.role === "ADMIN" && (!user.permissions || user.permissions.length === 0)) {
    user.permissions = ALL_PERMISSIONS;
    await user.save();
  }
  user.lastLoginAt = new Date();
  await user.save();
  const token = signToken(user);
  const response = ok({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  });
  response.cookies.set(COOKIE_NAME, token, cookieOptions());
  await audit(user._id, "auth.login", "user", String(user._id));
  return response;
}

export async function GET() {
  return badRequest("Use POST.");
}
