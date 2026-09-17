/**
 * MongoDB connection + first-run bootstrap.
 *
 * Reuses the logic from lib/server/db.ts but is expressed as a module that
 * the Express server calls once at boot. Development falls back to an
 * embedded mongodb-memory-server when MONGODB_URI isn't set or when the
 * Atlas connection fails; production hard-fails.
 */

import mongoose from "mongoose";

let bootstrapped = false;
const g = globalThis as typeof globalThis & {
  __aynamMemUri?: string;
  __aynamFallbackToMem?: boolean;
};

async function startEmbeddedMongo(): Promise<string> {
  if (g.__aynamMemUri) return g.__aynamMemUri;
  const fs = await import("fs/promises");
  const path = await import("path");
  const os = await import("os");
  const dbPath = path.join(os.tmpdir(), "aynam-mongo-dev");
  await fs.mkdir(dbPath, { recursive: true });
  const { MongoMemoryServer } = await import("mongodb-memory-server");
  const mem = await MongoMemoryServer.create({ instance: { dbPath } });
  g.__aynamMemUri = mem.getUri("aynam-crm");
  await fs.writeFile(
    path.join(dbPath, "uri.json"),
    JSON.stringify({ uri: g.__aynamMemUri, startedAt: new Date().toISOString() }),
    "utf8"
  ).catch(() => undefined);
  console.info("[db] embedded dev MongoDB at", g.__aynamMemUri.replace(/:[^:@]+@/, ":***@"));
  return g.__aynamMemUri;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) return mongoose;

  const forceDev = process.env.AYNAM_DEV_MONGO === "1";
  const isProd = process.env.NODE_ENV === "production";
  let uri = process.env.MONGODB_URI;

  if (forceDev || !uri) {
    uri = await startEmbeddedMongo();
  } else if (g.__aynamFallbackToMem && !isProd) {
    uri = await startEmbeddedMongo();
  } else {
    mongoose.set("autoIndex", true);
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      return mongoose;
    } catch (err) {
      console.error("[db] Atlas connect failed:", (err as Error).message.split("\n")[0]);
      if (isProd) throw err;
      console.warn("[db] falling back to embedded dev Mongo (set AYNAM_DEV_MONGO=1 to skip Atlas).");
      g.__aynamFallbackToMem = true;
      try { await mongoose.disconnect(); } catch { /* noop */ }
      uri = await startEmbeddedMongo();
    }
  }

  mongoose.set("autoIndex", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return mongoose;
}

export async function ensureBootstrap(): Promise<void> {
  if (bootstrapped) return;
  await connectDB();
  // Delegate to the existing bootstrap so we don't duplicate seed logic.
  const { ensureBootstrap: nextBootstrap } = await import("../lib/server/db");
  await nextBootstrap();
  bootstrapped = true;
}
