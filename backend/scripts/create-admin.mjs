#!/usr/bin/env node
/**
 * create-admin.mjs — one-shot script to upsert a full-permission ADMIN user
 * directly against MongoDB (the backend/Next server does NOT need to be running).
 *
 * Uses the Mongoose + bcryptjs already installed in backend/node_modules, so
 * `npm install` once is enough.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Usage  (run from inside backend/):
 *
 *   1) Provide everything via env vars (recommended — matches what's in your
 *      dotenv block):
 *
 *        MONGODB_URI="mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/aynam-crm?retryWrites=true&w=majority" \
 *        ADMIN_EMAIL="owner@aynam.in" \
 *        ADMIN_PASSWORD="Akshit123@098" \
 *        ADMIN_NAME="Main Admin" \
 *        node scripts/create-admin.mjs
 *
 *   2) Positional args — positional wins over env:
 *        node scripts/create-admin.mjs "<MONGODB_URI>" "owner@aynam.in" "Akshit123@098"
 *
 *   3) If you put MONGODB_URI / ADMIN_EMAIL / ADMIN_PASSWORD in backend/.env.local
 *      (or backend/.env) the script picks them up automatically — just run:
 *        node scripts/create-admin.mjs
 *
 *   4) Local dev: target the embedded mongodb-memory-server that the backend
 *      writes to tmp/aynam-mongo-dev/uri.json on first boot:
 *        node scripts/create-admin.mjs --dev owner@aynam.in Akshit123@098
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Behaviour:
 *   - If an ADMIN with that email already exists it is UPDATED (password
 *     rehashed, status forced ACTIVE, permissions topped up to full set).
 *   - Otherwise a new ADMIN document is inserted with every permission.
 *   - Other admins are NOT touched (no lockout risk).
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BACKEND_DIR = join(__dirname, "..");

// ---------- Minimal .env parser (zero extra deps) ----------
function parseEnv(text) {
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
for (const f of [join(BACKEND_DIR, ".env.local"), join(BACKEND_DIR, ".env")]) {
  if (existsSync(f)) {
    try { parseEnv(await readFile(f, "utf8")); } catch { /* ignore */ }
  }
}

// ---------- ALL_PERMISSIONS (mirrors backend/lib/server/permissions.ts) ----------
const ALL_PERMISSIONS = [
  "leads.view", "leads.create", "leads.edit", "leads.delete", "leads.assign", "leads.export", "leads.import",
  "leads.notes.view", "leads.notes.create", "leads.notes.delete",
  "leads.email.send", "leads.email.templates.view", "leads.email.templates.edit",
  "leads.followups.view", "leads.followups.edit",
  "automations.view", "automations.edit", "automations.toggle",
  "employees.view", "employees.create", "employees.edit", "employees.delete",
  "activities.view", "notifications.view", "notifications.manage",
  "settings.view", "settings.edit",
  "audit.view",
];

// Standalone User schema — reuses the same shape as backend/lib/server/models/User.ts
// but avoids pulling in the Next.js codebase (no `models.User` cache to worry about).
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ["ADMIN", "EMPLOYEE"], required: true },
    department: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "DISABLED", "INVITED"], default: "ACTIVE" },
    permissions: { type: [String], default: [] },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// ---------- arg parsing ----------
const args = process.argv.slice(2);
let uri = process.env.MONGODB_URI || "";
let email = process.env.ADMIN_EMAIL || "";
let password = process.env.ADMIN_PASSWORD || "";
let name = process.env.ADMIN_NAME || "Main Admin";
let devMode = process.env.AYNAM_DEV_MONGO === "1" && !process.env.MONGODB_URI;

for (const a of args) {
  if (a === "--dev" || a === "-d") { devMode = true; continue; }
  if (a.startsWith("mongodb://") || a.startsWith("mongodb+srv://")) { uri = a; continue; }
  if (a.includes("@")) { email = a; continue; }
  password = a;
}

if (devMode) {
  const markerFile = join(tmpdir(), "aynam-mongo-dev", "uri.json");
  if (!existsSync(markerFile)) {
    console.error(
      "[create-admin] --dev: couldn't find embedded Mongo metadata at\n           " + markerFile + "\n" +
      "           Start the backend once with `AYNAM_DEV_MONGO=1 npm run dev`\n" +
      "           (wait for the line '[db] embedded dev MongoDB started…'), then re-run."
    );
    process.exit(2);
  }
  try {
    const meta = JSON.parse(await readFile(markerFile, "utf8"));
    uri = meta.uri;
  } catch (e) {
    console.error("[create-admin] --dev: failed to parse", markerFile, "-", e.message);
    process.exit(2);
  }
}

if (!uri || !email || !password) {
  console.error("Missing arguments.\n\nUsage:");
  console.error("  MONGODB_URI=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/create-admin.mjs");
  console.error("  node scripts/create-admin.mjs <mongodb-uri> <email> <password>");
  console.error("  node scripts/create-admin.mjs --dev <email> <password>");
  console.error("");
  console.error(`Resolved → uri:${uri ? "yes" : "NO"}  email:${email || "NO"}  password:${password ? "yes" : "NO"}`);
  process.exit(2);
}
if (password.length < 6) {
  console.error("[create-admin] ADMIN_PASSWORD must be at least 6 characters.");
  process.exit(2);
}

const normalizedEmail = email.trim().toLowerCase();

// ---------- connect + upsert ----------
try {
  mongoose.set("autoIndex", false);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log("[create-admin] ✔ Connected to MongoDB");

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  const existing = await User.findOne({ role: "ADMIN", email: normalizedEmail });

  if (existing) {
    existing.name = name || existing.name || "Main Admin";
    existing.passwordHash = passwordHash;
    existing.status = "ACTIVE";
    existing.permissions = Array.from(new Set([...(existing.permissions || []), ...ALL_PERMISSIONS]));
    existing.updatedAt = now;
    await existing.save();
    console.log(`[create-admin] ✔ Updated ADMIN ${normalizedEmail} (id: ${existing._id}).`);
  } else {
    const created = await User.create({
      name: name || "Main Admin",
      email: normalizedEmail,
      role: "ADMIN",
      status: "ACTIVE",
      permissions: [...ALL_PERMISSIONS],
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`[create-admin] ✔ Created ADMIN ${normalizedEmail} (id: ${created._id}).`);
  }

  const adminCount = await User.countDocuments({ role: "ADMIN", status: "ACTIVE" });
  console.log(`[create-admin] Total ACTIVE admins now: ${adminCount}`);
  console.log("[create-admin] You can now log in at /login with the credentials you provided.");
} catch (err) {
  console.error("[create-admin] ✘ Failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
