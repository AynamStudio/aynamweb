/**
 * Legacy Next.js route adapter.
 *
 * Mounts every app/api/** /route.ts onto the Express app, translating between
 * Express req/res and the Web-standard Request / Response that Next route
 * handlers expect. AsyncLocalStorage + require-cache mocks for `next/headers`
 * and `next/server` make the existing `lib/server/auth.ts` (which calls
 * cookies()) work without source changes. All routes run through the
 * requireAuth() Express guard.
 */

import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import fs from "node:fs";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import { requireAuth } from "../auth";
import { ensureBootstrap } from "../db";

type Ctx = { req: Request; res: Response };
const als = new AsyncLocalStorage<Ctx>();

// ------------- mocks for next/headers + next/server -------------
function mockCookies() {
  const ctx = als.getStore();
  return {
    get: (n: string) =>
      ctx && ctx.req.cookies?.[n] !== undefined ? { name: n, value: String(ctx.req.cookies[n]) } : undefined,
    getAll: () =>
      ctx
        ? Object.entries(ctx.req.cookies || {}).map(([name, value]) => ({ name, value: String(value) }))
        : [],
    set: (n: string, v: string, opts: any = {}) => ctx?.res.cookie(n, v, opts),
    delete: (n: string, opts: any = {}) => ctx?.res.clearCookie(n, opts),
    has: (n: string) => !!ctx && Object.prototype.hasOwnProperty.call(ctx.req.cookies || {}, n),
  };
}
function mockHeaders() {
  const ctx = als.getStore();
  return { get: (k: string) => (ctx ? (ctx.req.header(k) ?? null) : null) };
}

function installMocks() {
  const headersPath = require.resolve("next/headers");
  if (!(require.cache[headersPath] as any)?.exports?.__aynam) {
    require.cache[headersPath] = {
      id: headersPath, filename: headersPath, loaded: true,
      exports: { cookies: mockCookies, headers: mockHeaders, __aynam: true },
    } as any;
  }
  const serverPath = require.resolve("next/server");
  if (!(require.cache[serverPath] as any)?.exports?.__aynam) {
    require.cache[serverPath] = {
      id: serverPath, filename: serverPath, loaded: true,
      exports: {
        NextResponse: {
          json: (body: any, init?: ResponseInit) =>
            new Response(JSON.stringify(body), {
              status: init?.status ?? 200,
              headers: { "content-type": "application/json", ...((init?.headers as any) || {}) },
            }),
          redirect: (url: string, status = 307) =>
            new Response(null, { status, headers: { location: url } }),
        },
        __aynam: true,
      },
    } as any;
  }
}
installMocks();

// ------------- helpers -------------
const __dirnameBak = __dirname;
const NEXT_APP_DIR = path.resolve(__dirnameBak, "../../app/api");

function toExpressPath(file: string): string {
  const rel = path.relative(NEXT_APP_DIR, file);
  const dir = path.dirname(rel);
  const parts = dir.split(path.sep).filter(Boolean);
  const expr = parts
    .map((p) => {
      const catchAll = p.match(/^\[\.\.\.(\w+)\]$/);
      if (catchAll) return `{*${catchAll[1]}}`;
      const dyn = p.match(/^\[(\w+)\]$/);
      if (dyn) return `:${dyn[1]}`;
      return p;
    })
    .join("/");
  return "/" + expr;
}

function buildWebRequest(req: Request): Request {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((x) => headers.append(k, String(x)));
    else headers.set(k, String(v));
  }
  const url = new URL(req.originalUrl, `${req.protocol}://${req.get("host")}`);
  const init: any = { method: req.method, headers, credentials: "include" };
  if (req.body && ["POST", "PATCH", "PUT", "DELETE"].includes(req.method)) {
    init.body = typeof req.body === "string" || Buffer.isBuffer(req.body)
      ? req.body
      : JSON.stringify(req.body);
    if (typeof req.body !== "string" && !Buffer.isBuffer(req.body)) {
      headers.set("content-type", "application/json");
    }
    init.duplex = "half";
  }
  return new Request(url.toString(), init);
}

async function runHandler(
  handler: Function,
  req: Request,
  res: Response,
  params: Record<string, string>
) {
  const webReq = buildWebRequest(req);
  const result = await handler(webReq, { params });
  if (result instanceof Response) {
    res.status(result.status);
    result.headers.forEach((v, k) => {
      if (k.toLowerCase() === "set-cookie") return; // handled via ALS mock (res.cookie)
      if (k.toLowerCase() === "access-control-allow-origin" && res.getHeader(k)) return;
      res.setHeader(k, v);
    });
    const text = await result.text();
    if (!res.writableEnded) res.send(text);
  } else if (!res.headersSent && !res.writableEnded) {
    res.status(204).end();
  }
}

// ------------- router -------------
export const legacyRouter = Router();

legacyRouter.use(async (_req, _res, next) => {
  try { await ensureBootstrap(); next(); }
  catch (e) { next(e); }
});

legacyRouter.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (req.path === "/health" || req.path === "/contact") return next();
  return requireAuth()(req, res, next);
});

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, files);
    else if (entry.isFile() && entry.name === "route.ts") files.push(p);
  }
  return files;
}

const HTTP = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const;
const SKIP = new Set(["/health", "/auth/login", "/auth/logout", "/auth/me", "/contact"]);

for (const file of walk(NEXT_APP_DIR)) {
  const mountAt = toExpressPath(file);
  if (SKIP.has(mountAt)) continue;
  legacyRouter.all(mountAt, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mod = require(file);
      const handler = mod[req.method as (typeof HTTP)[number]];
      if (typeof handler !== "function") {
        const allowed = HTTP.filter((m) => typeof mod[m] === "function").join(", ");
        res.setHeader("Allow", allowed);
        return res.status(405).json({ success: false, message: "Method not allowed." });
      }
      await als.run({ req, res }, () => runHandler(handler, req, res, (req.params as any) || {}));
    } catch (e) { next(e); }
  });
  console.info(`[routes] mounted legacy ${mountAt} → ${path.relative(process.cwd(), file)}`);
}
