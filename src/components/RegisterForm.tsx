"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type Role = "CUSTOMER" | "TRAVEL_AGENT" | "SUPPLIER";

const ROLE_TABS: { id: Role; label: string; blurb: string }[] = [
  { id: "CUSTOMER", label: "Traveller", blurb: "Book tours, get vouchers & manage trips" },
  { id: "TRAVEL_AGENT", label: "Travel agency", blurb: "Net rates, quotes & commission (B2B)" },
  { id: "SUPPLIER", label: "Tour operator", blurb: "Publish tours & receive bookings" },
];

export default function RegisterForm({ initialRole = "CUSTOMER" }: { initialRole?: Role }) {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<Role>(
    params.get("role") === "supplier" ? "SUPPLIER" : params.get("role") === "agent" || params.get("role") === "travel_agent" ? "TRAVEL_AGENT" : initialRole,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
      phone: form.get("phone"),
      country: form.get("country"),
      company: form.get("company"),
      role,
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Registration failed");
      router.push(role === "CUSTOMER" ? "/account" : role === "SUPPLIER" ? "/supplier" : "/agents");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-3 border-b border-gray-100">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRole(tab.id)}
            className={`px-3 py-4 text-sm font-semibold transition-colors ${role === tab.id ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="border-b border-gray-100 bg-sand-50 px-6 py-3 text-center text-xs text-gray-600">
        {ROLE_TABS.find((t) => t.id === role)?.blurb}
      </div>

      <form onSubmit={onSubmit} className="p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={role === "CUSTOMER" ? "sm:col-span-2" : ""}>
            <label className="label" htmlFor="reg-name">Full name *</label>
            <input id="reg-name" name="name" required minLength={2} autoComplete="name" className="input" placeholder="Your name" />
          </div>
          {role !== "CUSTOMER" && (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="reg-company">{role === "SUPPLIER" ? "Company name *" : "Agency name *"}</label>
              <input id="reg-company" name="company" required minLength={2} className="input" placeholder={role === "SUPPLIER" ? "e.g. Bali Asli Tours" : "e.g. Atlas World Travel"} />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="reg-email">Email *</label>
            <input id="reg-email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="reg-password">Password * <span className="font-normal text-gray-400">(min 8 characters)</span></label>
            <input id="reg-password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" placeholder="••••••••" />
          </div>
          <div>
            <label className="label" htmlFor="reg-phone">Phone / WhatsApp</label>
            <input id="reg-phone" name="phone" autoComplete="tel" className="input" placeholder="+1 555 000 000" />
          </div>
          <div>
            <label className="label" htmlFor="reg-country">Country</label>
            <input id="reg-country" name="country" className="input" placeholder="Your country" />
          </div>
        </div>

        {role !== "CUSTOMER" && (
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            {role === "TRAVEL_AGENT"
              ? "B2B accounts are approved by our team (usually within one business day) before net rates unlock."
              : "Supplier accounts require verification — we'll ask for your licence documents before publishing tours."}
          </p>
        )}

        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary mt-5 w-full py-3">
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already registered? <a href={`/login?next=${encodeURIComponent("/")}`} className="font-medium text-brand-600 hover:underline">Sign in</a>
        </p>
      </form>
    </div>
  );
}
