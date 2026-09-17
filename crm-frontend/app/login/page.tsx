"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/components/admin/ui";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const { status } = await api("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (status === 200) window.location.replace("/dashboard");
    else {
      setError("Invalid credentials. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-5" style={{ background: "#000" }}>
      {/* subtle blue-tinted grid/texture on the backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 40% at 50% 0%, rgba(37,99,235,0.12), transparent 60%), radial-gradient(40% 40% at 80% 100%, rgba(37,99,235,0.06), transparent 70%)",
        }}
      />

      <div className="fade-in relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center">
          <div className="aynam-logo" style={{ height: 56, width: 260 }}>
            <Image src="/brand/logo.png" alt="AYNAM" fill sizes="260px" priority quality={95} />
          </div>
          <p className="mt-4 label-tech">Internal Workspace</p>
        </div>

        <form onSubmit={submit} className="panel p-7">
          <h1 className="text-lg font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-xs" style={{ color: "var(--text-3)" }}>
            Private system. All access is logged.
          </p>

          <label className="mt-6 block">
            <span className="label-tech mb-1.5 block">Email</span>
            <input
              type="email"
              autoComplete="username"
              className="input"
              placeholder="you@aynam.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="mt-4 block">
            <span className="label-tech mb-1.5 block">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border px-3 py-2 text-xs"
              style={{
                borderColor: "rgba(239,68,68,0.4)",
                background: "rgba(239,68,68,0.10)",
                color: "#fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary mt-6 w-full" style={{ padding: "11px 18px" }}>
            {busy ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p className="mt-6 text-center text-[11px]" style={{ color: "var(--text-3)" }}>
          © {new Date().getFullYear()} AYNAM — Software for a smarter tomorrow.
        </p>
      </div>
    </div>
  );
}
