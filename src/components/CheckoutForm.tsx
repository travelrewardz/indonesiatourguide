"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { TourOption } from "@/lib/types";

type Quote = {
  display: { currency: string; unit: number; total: number; discount: number };
  options: { id: string; price: number }[];
  pricing: { unitPrice: number; total: number; priceLabel: string | null };
  availability: { status: string; remaining: number };
  canBook: boolean;
};

export default function CheckoutForm({
  tourSlug, tourTitle, options, currency, minPax, maxPax, prefill, user, providers,
}: {
  tourSlug: string;
  tourTitle: string;
  options: TourOption[];
  currency: string;
  minPax: number;
  maxPax: number;
  prefill: { option?: string; date?: string; adults?: number; children?: number };
  user: { name: string; email: string } | null;
  providers: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [optionId, setOptionId] = useState(prefill.option || options[0]?.id || "");
  const [date, setDate] = useState(prefill.date || "");
  const [adults, setAdults] = useState(prefill.adults || Math.max(1, minPax));
  const [children, setChildren] = useState(prefill.children || 0);
  const [provider, setProvider] = useState(providers[0]?.id ?? "sandbox");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pax = adults + children;

  const fetchQuote = useCallback(async () => {
    if (!date) return;
    const params = new URLSearchParams({ date, pax: String(pax), currency });
    if (optionId) params.set("optionId", optionId);
    try {
      const res = await fetch(`/api/tours/${tourSlug}/quote?${params}`);
      const data = await res.json();
      if (res.ok) setQuote(data);
    } catch {
      /* transient */
    }
  }, [tourSlug, optionId, date, pax, currency]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = {
      tourSlug,
      optionId: optionId || null,
      travelDate: date,
      adults,
      children,
      pickupLocation: String(form.get("pickupLocation") ?? ""),
      hotel: String(form.get("hotel") ?? ""),
      specialRequest: String(form.get("specialRequest") ?? ""),
      customerName: String(form.get("customerName") ?? ""),
      customerEmail: String(form.get("customerEmail") ?? ""),
      customerPhone: String(form.get("customerPhone") ?? ""),
      paymentProvider: provider,
      agree: true,
    };
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Booking failed");
      router.push(data.paymentUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
      setLoading(false);
    }
  }

  const fmt = (v: number | undefined | null) =>
    v == null
      ? "—"
      : new Intl.NumberFormat("en-US", {
          style: "currency", currency,
          maximumFractionDigits: currency === "IDR" ? 0 : 2,
          minimumFractionDigits: 0,
        }).format(v);

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {/* STEP 1 — trip */}
        <section className="card p-6">
          <h2 className="text-lg font-bold">1 · Your trip</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {options.length > 0 && (
              <div className="sm:col-span-2">
                <label className="label" htmlFor="co-option">Option</label>
                <select id="co-option" className="input" value={optionId} onChange={(e) => setOptionId(e.target.value)}>
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} — {fmt(quote?.options.find((q) => q.id === o.id)?.price ?? o.price)}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label" htmlFor="co-date">Travel date *</label>
              <input id="co-date" type="date" required className="input" value={date}
                min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="co-adults">Adults *</label>
                <select id="co-adults" className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
                  {Array.from({ length: Math.min(20, maxPax) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="co-children">Children</label>
                <select id="co-children" className="input" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
                  {Array.from({ length: Math.min(10, Math.max(0, maxPax - adults + 1)) }, (_, i) => i).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label" htmlFor="co-pickup">Pickup location *</label>
              <input id="co-pickup" name="pickupLocation" required minLength={2} className="input"
                placeholder="Airport, hotel or landmark" defaultValue="Hotel pickup" />
            </div>
            <div>
              <label className="label" htmlFor="co-hotel">Hotel name</label>
              <input id="co-hotel" name="hotel" className="input" placeholder="Where are you staying?" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="co-special">Special requests</label>
              <textarea id="co-special" name="specialRequest" rows={3} className="input"
                placeholder="Dietary needs, mobility, language guide, early pickup…" />
            </div>
          </div>
        </section>

        {/* STEP 2 — contact */}
        <section className="card p-6">
          <h2 className="text-lg font-bold">2 · Contact details</h2>
          {!user && (
            <p className="mt-2 text-sm text-gray-500">
              Booking as a guest — <Link href="/login" className="font-medium text-brand-600 hover:underline">sign in</Link> to track it in your dashboard.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="co-name">Full name *</label>
              <input id="co-name" name="customerName" required minLength={2} className="input" defaultValue={user?.name ?? ""} placeholder="Lead traveller" />
            </div>
            <div>
              <label className="label" htmlFor="co-email">Email *</label>
              <input id="co-email" name="customerEmail" type="email" required className="input" defaultValue={user?.email ?? ""} placeholder="you@example.com" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="co-phone">Phone / WhatsApp</label>
              <input id="co-phone" name="customerPhone" className="input" placeholder="+1 555 000 000" />
            </div>
          </div>
        </section>

        {/* STEP 3 — payment */}
        <section className="card p-6">
          <h2 className="text-lg font-bold">3 · Payment method</h2>
          <div className="mt-4 space-y-2">
            {providers.map((p) => (
              <label key={p.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${provider === p.id ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-gray-300"}`}>
                <input type="radio" name="provider" value={p.id} checked={provider === p.id} onChange={() => setProvider(p.id)} className="accent-brand-600" />
                <span className="font-medium">{p.label}</span>
              </label>
            ))}
          </div>
          <label className="mt-4 flex items-start gap-2.5 text-sm text-gray-600">
            <input type="checkbox" required className="mt-1 accent-brand-600" />
            <span>I agree to the <Link href="/terms" className="text-brand-600 underline">booking terms</Link> and cancellation policy.</span>
          </label>
        </section>

        {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>

      {/* SUMMARY */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-gray-100 bg-sand-50 px-5 py-4 font-bold">{tourTitle}</div>
          <dl className="space-y-2 px-5 py-4 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Date</dt><dd className="font-medium">{date || "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Travellers</dt><dd className="font-medium">{pax} ({adults}A{children > 0 ? ` + ${children}C` : ""})</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Option</dt><dd className="max-w-44 text-right font-medium">{options.find((o) => o.id === optionId)?.name ?? "Standard"}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Unit price</dt><dd className="font-medium">{fmt(quote?.display.unit)}</dd></div>
            {quote?.pricing.priceLabel && (
              <div className="flex justify-between text-brand-600"><dt>{quote.pricing.priceLabel}</dt><dd>✓</dd></div>
            )}
          </dl>
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-2xl font-bold text-brand-700">{quote ? fmt(quote.display.total) : date ? "…" : "—"}</span>
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              Charged in USD after server-side verification. Free date changes up to 48h before departure.
            </p>
          </div>
          <div className="px-5 pb-5">
            {date && quote && !quote.canBook ? (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
                {quote.availability.status === "SOLD_OUT" ? "This date is sold out" : "This date is closed"}
              </div>
            ) : (
              <button type="submit" disabled={loading || !date || !quote} className="btn-accent w-full py-3 text-base">
                {loading ? "Processing…" : quote ? `Confirm & pay ${fmt(quote.display.total)}` : "Select a date"}
              </button>
            )}
            <div className="mt-3 flex items-center justify-center gap-3 text-xs text-gray-400">
              <span>🔒 Secure payment</span><span>·</span><span>Instant confirmation</span>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}
