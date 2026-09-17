import mongoose from "mongoose";
import { User } from "./models/User";
import { EmailTemplate } from "./models/EmailTemplate";
import { ALL_PERMISSIONS } from "./permissions";
import { seedDefaultAutomations } from "./services/automation";
import { hashPassword } from "./auth";

let bootstrapped = false;
const g = globalThis as typeof globalThis & {
  __aynamMemUri?: string;
  __aynamFallbackToMem?: boolean;
  __aynamLastConnectError?: number;
};

/**
 * Single reusable connection (cached on globalThis for Next dev/HMR).
 *
 * Resolution order:
 *   1. If AYNAM_DEV_MONGO=1 OR no MONGODB_URI is set → embedded mongodb-memory-server.
 *   2. Otherwise attempt MONGODB_URI. On a CONNECTION failure in dev,
 *      fall back to the embedded Mongo (once per process) so the CRM
 *      stays usable even if Atlas IP-whitelist / VPN / network is broken.
 *      Production does NOT fall back: it errors loudly so ops notices.
 *   3. On repeated failures we back off logging so the console isn't
 *      spammed with the same MongooseServerSelectionError every 10s.
 */
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
  // Persist URI so scripts/create-admin.mjs can find the running dev DB.
  fs.writeFile(
    path.join(dbPath, "uri.json"),
    JSON.stringify({ uri: g.__aynamMemUri, startedAt: new Date().toISOString() }),
    "utf8"
  ).catch(() => undefined);
  console.info("[db] embedded dev MongoDB started at", g.__aynamMemUri.replace(/:[^:@]+@/, ":***@"));
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
    // We already decided once this session that Atlas isn't reachable —
    // stick with the embedded instance instead of retrying every request.
    uri = await startEmbeddedMongo();
  } else {
    // Try Atlas once; on connection failure in dev, transparently switch.
    mongoose.set("autoIndex", true);
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      return mongoose;
    } catch (err) {
      const msg = (err as Error).message;
      const now = Date.now();
      if (!g.__aynamLastConnectError || now - g.__aynamLastConnectError > 30_000) {
        g.__aynamLastConnectError = now;
        console.error("[db] MongoDB connection failed:", msg.split("\n")[0]);
      }
      if (isProd) throw err;
      console.warn("[db] falling back to embedded dev MongoDB for this session (set AYNAM_DEV_MONGO=1 to skip Atlas).");
      g.__aynamFallbackToMem = true;
      try {
        await mongoose.disconnect();
      } catch {
        /* noop */
      }
      uri = await startEmbeddedMongo();
    }
  }

  mongoose.set("autoIndex", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  return mongoose;
}

/**
 * Safe guard for callers (e.g. the scheduler) that want to no-op when the DB
 * isn't reachable instead of throwing into every request tick.
 */
export async function isDBConnected(): Promise<boolean> {
  if ((mongoose.connection.readyState as number) === 1) return true;
  try {
    await connectDB();
    return (mongoose.connection.readyState as number) === 1;
  } catch {
    return false;
  }
}

/** First-run bootstrap: main admin from env + default email templates. */
export async function ensureBootstrap(): Promise<void> {
  if (bootstrapped) return;
  await connectDB();
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const existing = await User.findOne({ role: "ADMIN" });
    if (!existing) {
      await User.create({
        name: "Main Admin",
        email,
        role: "ADMIN",
        status: "ACTIVE",
        permissions: ALL_PERMISSIONS,
        passwordHash: await hashPassword(password),
      });
      console.info("[crm] initial admin created from environment");
    }
  }
  const admin = await User.findOne({ role: "ADMIN" });
  await seedDefaultAutomations(admin?._id ?? null);
  if ((await EmailTemplate.countDocuments()) === 0) {
    await EmailTemplate.insertMany([
      {
        name: "Follow-up",
        category: "FOLLOW_UP",
        status: "ACTIVE",
        subject: "Following up on your AYNAM enquiry",
        html: "<p>Hi {{name}},</p><p>I'm following up on your enquiry about {{projectType}}. Do you have time this week for a short call?</p><p>Best,<br>{{assignedEmployee}}</p>",
      },
      {
        name: "Welcome",
        category: "WELCOME",
        status: "ACTIVE",
        subject: "Welcome to AYNAM",
        html: "<p>Hi {{name}},</p><p>Thanks for trusting us with your project. Here's what you can expect next…</p>",
      },
    ]);
  }
  bootstrapped = true;
}
