import { NextResponse } from "next/server";
import { getSessionUser } from "./auth";
import { hasPerm, type Permission } from "./permissions";
import type { IUser } from "./models/User";
import { connectDB, ensureBootstrap } from "./db";

export const ok = (data: unknown, init?: ResponseInit) =>
  NextResponse.json({ success: true, data }, init);

export const err = (status: number, message: string, code = "ERROR") =>
  NextResponse.json({ success: false, message, code }, { status });

export const unauthorized = () => err(401, "Authentication required.", "UNAUTHENTICATED");
export const forbidden = () => err(403, "You don't have permission to do this.", "FORBIDDEN");
export const notFound = () => err(404, "Not found.", "NOT_FOUND");
export const badRequest = (message = "Please check the information you entered.") =>
  err(400, message, "VALIDATION_ERROR");

/** DB-ready + authenticated (+ optionally permissioned) request guard. */
export async function requireUser(perm?: Permission): Promise<
  { user: IUser; res?: never } | { user?: never; res: NextResponse }
> {
  await ensureBootstrap();
  const user = await getSessionUser();
  if (!user) return { res: unauthorized() };
  if (perm && !hasPerm(user, perm)) return { res: forbidden() };
  return { user };
}

/** Read + zod-parse a JSON body, returning validation errors safely. */
export async function parseBody<T>(req: Request, schema: { safeParse: (d: unknown) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }): Promise<
  { data: T; res?: never } | { data?: never; res: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { res: badRequest() };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { res: badRequest(parsed.error.issues[0]?.message || "Please check the information you entered.") };
  }
  return { data: parsed.data };
}
