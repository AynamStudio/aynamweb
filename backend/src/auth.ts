/**
 * Auth helpers for Express.
 *
 * Reuses bcrypt/jwt primitives from lib/server/auth.ts and adapts them to
 * req/res/cookies from Express rather than Next's cookies() store.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { User, type IUser } from "../lib/server/models/User";
import { ALL_PERMISSIONS } from "../lib/server/permissions";

export const COOKIE_NAME = "aynam_sess";
const secret = () =>
  process.env.JWT_SECRET || process.env.SESSION_SECRET || "aynam-dev-secret-change-me";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export function signToken(user: IUser): string {
  return jwt.sign({ sub: String(user._id), email: user.email }, secret(), { expiresIn: "12h" });
}

export function cookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd,
    path: "/",
    domain: isProd && process.env.COOKIE_DOMAIN ? process.env.COOKIE_DOMAIN : undefined,
    maxAge: 60 * 60 * 12 * 1000,
    signed: false,
  };
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export async function getUserFromReq(req: Request): Promise<IUser | null> {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  let payload: { sub?: string } | null = null;
  try {
    payload = jwt.verify(token, secret()) as { sub?: string };
  } catch {
    return null;
  }
  if (!payload?.sub) return null;
  const user = await User.findById(payload.sub);
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}

export type AuthedRequest = Request & { user: IUser };

export function requireAuth(perm?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: "Authentication required.", code: "UNAUTHENTICATED" });
    if (perm && user.role !== "ADMIN" && !user.permissions.includes(perm as any)) {
      return res.status(403).json({ success: false, message: "You don't have permission.", code: "FORBIDDEN" });
    }
    (req as AuthedRequest).user = user;
    next();
  };
}

// Re-export permission list (used by the login route to upgrade admin perms).
export { ALL_PERMISSIONS };
