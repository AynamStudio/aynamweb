import { NextResponse } from "next/server";
import { COOKIE_NAME, cookieOptions, getSessionUser } from "@/lib/server/auth";
import { ok } from "@/lib/server/guards";
import { audit } from "@/lib/server/audit";

export async function POST() {
  const user = await getSessionUser();
  if (user) await audit(user._id, "auth.logout", "user", String(user._id));
  const res = ok({ loggedOut: true });
  res.cookies.set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
  return res;
}
