import { Router } from "express";
import { z } from "zod";
import { User } from "../../lib/server/models/User";
import { audit } from "../../lib/server/audit";
import { clearSessionCookie, requireAuth, setSessionCookie, signToken, verifyPassword, ALL_PERMISSIONS } from "../auth";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(200),
});

// POST /api/auth/login  (rate-limited from server.ts)
authRouter.post("/login", async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid credentials.", code: "INVALID" });
    }
    const email = parsed.data.email.toLowerCase().trim();
    const user = await User.findOne({ email });
    if (!user || user.status === "DISABLED") {
      // Generic error to avoid user enumeration
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }
    const ok = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, message: "Invalid credentials." });

    if (user.status === "INVITED") user.status = "ACTIVE";
    if (user.role === "ADMIN" && (!user.permissions || user.permissions.length === 0)) {
      user.permissions = [...ALL_PERMISSIONS];
    }
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    setSessionCookie(res, token);

    await audit(user._id, "auth.login", "user", String(user._id)).catch(() => undefined);

    return res.json({
      success: true,
      data: {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      },
    });
  } catch (e) { next(e); }
});

// POST /api/auth/logout
authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true });
});

// GET /api/auth/me
authRouter.get("/me", requireAuth(), (req, res) => {
  const u = (req as any).user;
  res.json({
    success: true,
    data: {
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department || "",
      permissions: u.permissions,
    },
  });
});
