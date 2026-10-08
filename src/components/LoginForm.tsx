"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Login failed");
      const next = params.get("next");
      router.push(next || data.redirect || "/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8">
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="login-email">Email</label>
          <input id="login-email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="login-password">Password</label>
          <input id="login-password" name="password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" />
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary mt-5 w-full py-3">
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/register" className="font-medium text-brand-600 hover:underline">Create an account</Link>
        <Link href="/contact" className="text-gray-500 hover:text-brand-600">Forgot password?</Link>
      </div>

      <div className="mt-6 rounded-xl bg-sand-50 p-4 text-xs leading-5 text-gray-600">
        <b className="text-ink">Demo accounts</b> (local dev):<br />
        Customer — customer@demo.com / demo1234<br />
        Agency — maria@atlasworld.es / demo1234<br />
        Supplier — ops.bali@partner.indonesiatourguide.com / demo1234<br />
        Admin — admin@indonesiatourguide.com / admin1234
      </div>
    </form>
  );
}
