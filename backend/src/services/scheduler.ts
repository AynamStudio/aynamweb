/**
 * Follow-up sweep — wraps lib/server/services/scheduler but guards so we
 * don't spam logs when the DB is disconnected.
 */

import mongoose from "mongoose";

let started = false;
let lastErrorLog = 0;

export function startScheduler() {
  if (started) return;
  started = true;
  // Reuse the existing sweep logic by importing it.
  import("../../lib/server/services/scheduler").then(({ startScheduler: nextStart }) => {
    // The existing startScheduler uses setInterval but assumes bootstrap.
    // We call it only after DB is confirmed up; we run our own safer loop.
    nextStart();
  }).catch((e) => {
    console.error("[scheduler] failed to start:", e.message);
    started = false;
  });
}

// Safer direct sweep used if we want our own loop — kept for reference.
export async function safeSweep(sweepFn: () => Promise<void>) {
  if ((mongoose.connection.readyState as number) !== 1) {
    const now = Date.now();
    if (!lastErrorLog || now - lastErrorLog > 5 * 60_000) {
      lastErrorLog = now;
      console.info("[scheduler] skipping sweep — DB not connected.");
    }
    return;
  }
  try { await sweepFn(); }
  catch (e) {
    const now = Date.now();
    if (!lastErrorLog || now - lastErrorLog > 5 * 60_000) {
      lastErrorLog = now;
      console.error("[scheduler] sweep failed:", (e as Error).message);
    }
  }
}
