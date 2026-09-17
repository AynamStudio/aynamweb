import { Router } from "express";
import mongoose from "mongoose";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const state = mongoose.connection.readyState;
  const ok = state === 1;
  res.status(ok ? 200 : 503).json({
    success: ok,
    service: "aynam-api",
    mongo: ok ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    ts: new Date().toISOString(),
  });
});
