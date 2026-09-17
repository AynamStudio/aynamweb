import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { User, type IUser } from "./models/User";

export const COOKIE_NAME = "aynam_sess";
const secret = () => process.env.SESSION_SECRET || "aynam-dev-session-secret-change-me";

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);

export function signToken(user: IUser): string {
  return jwt.sign({ sub: String(user._id), email: user.email }, secret(), { expiresIn: "12h" });
}

export function verifyToken(token: string): { sub: string; email: string } | null {
  try {
    return jwt.verify(token, secret()) as { sub: string; email: string };
  } catch {
    return null;
  }
}

export function cookieOptions(): Record<string, unknown> {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain: process.env.COOKIE_DOMAIN || undefined, // e.g. ".aynam.studio" for subdomain sessions
    maxAge: 60 * 60 * 12,
  };
}

/** Resolve the authenticated user for the current request (or null). */
export async function getSessionUser(): Promise<IUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await User.findById(payload.sub);
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}
