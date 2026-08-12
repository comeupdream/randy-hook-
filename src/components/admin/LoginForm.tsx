"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminLogin } from "@/lib/client/api";
import { DEMO_ADMIN_PASSWORD, IS_DEMO } from "@/lib/mode";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await adminLogin(password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "Sign-in failed.");
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 space-y-4">
      <div>
        <label className="field-label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="field-input"
          placeholder="••••••••"
        />
        {IS_DEMO && (
          <p className="mt-2 rounded-lg bg-gold/10 px-3 py-2 text-xs text-ink/70">
            Demo preview — sign in with the password{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 font-semibold">
              {DEMO_ADMIN_PASSWORD}
            </code>
            .
          </p>
        )}
      </div>
      {error && (
        <p className="rounded-lg bg-accent/5 px-3 py-2 text-sm text-accent">{error}</p>
      )}
      <button type="submit" disabled={loading || !password} className="btn-accent w-full">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
