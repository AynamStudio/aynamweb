import { NextResponse } from "next/server";

/* Render health-check target: unauthenticated, cheap, no DB touch. */
export async function GET() {
  return NextResponse.json({ success: true, status: "ok", ts: Date.now() });
}
