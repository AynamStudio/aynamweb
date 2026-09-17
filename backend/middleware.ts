import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
 * CORS for the two frontends (public website + CRM dashboard).
 *
 * We must apply CORS headers via response.headers on the FINAL response
 * (including the one that carries Set-Cookie from /api/auth/login) — not
 * on a fresh NextResponse.next(), because in some Next versions the two
 * header maps don't get merged, causing the browser to drop the cookie on
 * cross-origin POSTs (which manifested as POST /api/auth/login 200 followed
 * by every next call returning 401).
 */
const ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function applyCors(res: NextResponse, origin: string) {
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.append("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const allowed = ORIGINS.includes(origin);

  // Preflight
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (allowed) applyCors(res, origin);
    res.headers.set("Access-Control-Max-Age", "600");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  const res = NextResponse.next();
  if (allowed) applyCors(res, origin);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = {
  matcher: ["/api/:path*"],
};
