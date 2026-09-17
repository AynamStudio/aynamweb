"use client";

import { useState } from "react";
import { api, Btn, Input, Label } from "@/components/admin/ui";

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
    if (status === 200) location.href = "/dashboard";
    else {
      setError("Invalid credentials. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="s-dark flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <p className="headline text-center text-2xl tracking-[0.35em] text-fog">AYNAM</p>
        <p className="label-tech mt-2 text-center text-fog-muted">Internal System</p>
        <form onSubmit={submit} className="mt-10 border border-line bg-card/5 px-6 py-8">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          <div className="mt-5">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          {error && <p role="alert" className="mt-4 text-xs text-red-400">{error}</p>}
          <Btn type="submit" disabled={busy} className="mt-7 w-full justify-center">
            {busy ? "Signing in…" : "Sign in →"}
          </Btn>
        </form>
        <p className="mt-6 text-center text-[11px] text-fog-muted">Private workspace. Access is logged.</p>
      </div>
    </div>
  );
}
