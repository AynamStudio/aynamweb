import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/*
 * CORS for the two frontends (public website + CRM dashboard).
 * Both deploy on subdomains of the same site in production, so the session
 * cookie stays same-site; locally everything is localhost (also same-site).
 */
const ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function addCors(res: NextResponse, origin: string) {
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const allowed = ORIGINS.includes(origin);
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (allowed) addCors(res, origin);
    res.headers.set("Access-Control-Max-Age", "600");
    return res;
  }
  const res = NextResponse.next();
  if (allowed) addCors(res, origin);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/api/:path*"] };
