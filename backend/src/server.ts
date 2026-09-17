/**
 * AYNAM backend — Express API server.
 *
 * Hardened defaults:
 *   - Helmet (CSP, HSTS, X-Frame-Options, noSniff, Referrer-Policy).
 *   - Strict CORS allowlist from CORS_ORIGINS — credentials on; cookie is
 *     httpOnly, SameSite=Lax, Secure in production, scoped to COOKIE_DOMAIN.
 *   - IP-based rate limits: aggressive on /api/auth/login, moderate on
 *     /api/contact, permissive elsewhere.
 *   - Body size caps (JSON 100kb, urlencoded 50kb).
 *   - Request-ID + access log, malformed-JSON guard, stack-hiding error
 *     handler, graceful shutdown.
 *   - Existing Next.js app/api/** route handlers are mounted via a
 *     compatibility shim (src/routes/legacyShim) while we migrate them to
 *     native Express routes; the public-facing endpoints (/api/health,
 *     /api/auth/*, /api/contact) are already pure Express.
 */

import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import http from "node:http";
import mongoose from "mongoose";
import type { NextFunction, Request, Response } from "express";

import { connectDB, ensureBootstrap } from "./db";
import { authRouter } from "./routes/auth";
import { contactRouter } from "./routes/contact";
import { healthRouter } from "./routes/health";
import { legacyRouter } from "./routes/legacyShim";
import { startScheduler } from "./services/scheduler";
import { cookieOptions, COOKIE_NAME } from "./auth";

const app = express();
const PORT = Number(process.env.PORT || 4000);
const isProd = process.env.NODE_ENV === "production";

/* -------------------------------------------------------------- */
/*  Security headers (Helmet)                                      */
/* -------------------------------------------------------------- */
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(
  helmet({
    // CSP — API only, so lock down tight.
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'none'"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'none'"],
      },
    },
    hsts: isProd
      ? { maxAge: 63_072_000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: "no-referrer" },
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    frameguard: { action: "deny" },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    hidePoweredBy: true,
    xssFilter: true,
  })
);

/* -------------------------------------------------------------- */
/*  CORS — strict allowlist from env, credentials on              */
/* -------------------------------------------------------------- */
const ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Same-origin / curl (no origin) always allowed.
      if (!origin) return cb(null, true);
      if (ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error(`Origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 600,
  })
);
// cors middleware handles OPTIONS preflight.

/* -------------------------------------------------------------- */
/*  Body parsing with hard size caps                               */
/* -------------------------------------------------------------- */
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "50kb" }));
app.use(cookieParser());

// Catch JSON parse errors and return 400 instead of crashing.
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Malformed JSON body." });
  }
  if (err && err.status === 413) {
    return res.status(413).json({ success: false, message: "Payload too large." });
  }
  return next(err);
});

/* -------------------------------------------------------------- */
/*  Request ID + lightweight access log                            */
/* -------------------------------------------------------------- */
app.use((req, res, next) => {
  const id = Math.random().toString(36).slice(2, 10);
  res.setHeader("X-Request-ID", id);
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const ip = req.ip || (req.headers["x-forwarded-for"] as string)?.split(",")[0] || "-";
    const len = res.getHeader("content-length") ?? "-";
    console.info(`[${id}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms ${len}B ip=${ip}`);
  });
  next();
});

/* -------------------------------------------------------------- */
/*  Rate limiting                                                  */
/* -------------------------------------------------------------- */
// express-rate-limit picks up req.ip automatically. With trust proxy = 1
// req.ip is the first hop of X-Forwarded-For, which is what we want.
const rlCommon = {
  standardHeaders: "draft-7" as const,
  legacyHeaders: false,
  validate: { trustProxy: true, ip: false },
};

const loginLimiter = rateLimit({
  ...rlCommon,
  windowMs: Number(process.env.LOGIN_RATE_WINDOW_MS || 10 * 60_000),
  limit: Number(process.env.LOGIN_RATE_MAX || 8),
  message: { success: false, message: "Too many login attempts. Try again later.", code: "RATE_LIMITED" },
});

const apiLimiter = rateLimit({
  ...rlCommon,
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 10 * 60_000),
  limit: Number(process.env.RATE_LIMIT_MAX || 200),
  message: { success: false, message: "Too many requests. Slow down.", code: "RATE_LIMITED" },
});

const contactLimiter = rateLimit({
  ...rlCommon,
  windowMs: 10 * 60_000,
  limit: 5,
  message: { success: false, message: "Too many submissions. Please try again later." },
});

/* -------------------------------------------------------------- */
/*  API routes                                                     */
/* -------------------------------------------------------------- */
app.get("/", (_req, res) => {
  res
    .status(404)
    .set("Content-Type", "text/plain")
    .send("AYNAM API");
});

app.use("/api/health", healthRouter);
app.use("/api/auth/login", loginLimiter, authRouter);
app.use("/api/auth", authRouter);
app.use("/api/contact", contactLimiter, contactRouter);
// All other /api routes get the general api limiter and are served from
// the legacy Next-route shim while we migrate.
app.use("/api", apiLimiter, legacyRouter);

/* -------------------------------------------------------------- */
/*  404 + error handler                                            */
/* -------------------------------------------------------------- */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Not found." });
});

// Final error handler: never leak stacks in production.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[error]", err);
  if (err?.message?.startsWith?.("Origin not allowed")) {
    return res.status(403).json({ success: false, message: "Origin not allowed." });
  }
  const status = typeof err.status === "number" ? err.status : 500;
  const message = process.env.NODE_ENV === "production" ? "Internal server error." : err.message || "Internal server error.";
  res.status(status).json({ success: false, message });
});

/* -------------------------------------------------------------- */
/*  Boot: connect Mongo → bootstrap admin/templates → listen        */
/* -------------------------------------------------------------- */
async function boot() {
  await connectDB();
  await ensureBootstrap();
  startScheduler();

  const server = http.createServer(app);
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
  server.listen(PORT, "0.0.0.0", () => {
    console.info(`[aynam-api] listening on http://0.0.0.0:${PORT} (prod=${isProd})`);
    console.info(`[aynam-api] CORS origins: ${ORIGINS.join(", ") || "(none — same-origin only)"}`);
    console.info(`[aynam-api] mongo: ${mongoose.connection.host || "embedded"}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.info(`[aynam-api] ${signal} — shutting down…`);
    await new Promise((r) => server.close(r));
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

boot().catch((err) => {
  console.error("[boot] fatal:", err);
  process.exit(1);
});

// Exported for tests.
export { app, cookieOptions, COOKIE_NAME };
