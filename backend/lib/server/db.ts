import mongoose from "mongoose";
import { User } from "./models/User";
import { EmailTemplate } from "./models/EmailTemplate";
import { ALL_PERMISSIONS } from "./permissions";
import { seedDefaultAutomations } from "./services/automation";
import { hashPassword } from "./auth";

let bootstrapped = false;

/**
 * Single reusable connection (cached on globalThis for Next dev/HMR).
 * Production requires MONGODB_URI. Development without one falls back to a
 * local mongodb-memory-server with a persisted dbPath so the CRM is usable
 * out of the box — never in production.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState >= 1) return mongoose;
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    if (process.env.NODE_ENV === "production" && process.env.AYNAM_DEV_MONGO !== "1") {
      throw new Error("MONGODB_URI is not configured");
    }
    const g = globalThis as typeof globalThis & { __aynamMemUri?: string };
    if (!g.__aynamMemUri) {
      const fs = await import("fs/promises");
      const path = await import("path");
      /* keep dev data OUT of the repo/workspace snapshot (it can grow to 100s of MB) */
      const os = await import("os");
      const dbPath = path.join(os.tmpdir(), "aynam-mongo-dev");
      await fs.mkdir(dbPath, { recursive: true });
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mem = await MongoMemoryServer.create({ instance: { dbPath } });
      g.__aynamMemUri = mem.getUri("aynam-crm");
    }
    uri = g.__aynamMemUri;
  }
  mongoose.set("autoIndex", true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose;
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
