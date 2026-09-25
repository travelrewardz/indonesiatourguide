"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TourOption = {
  slug: string;
  title: string;
  retail: number;
  days: number;
};

export default function QuoteBuilder({
  tours,
  languages,
  initialTour,
  discountPct,
}: {
  tours: TourOption[];
  languages: string[];
  initialTour: string;
  discountPct: number;
}) {
  const router = useRouter();
  const [tourSlug, setTourSlug] = useState(initialTour);
  const [travelDate, setTravelDate] = useState("");
  const [pax, setPax] = useState(2);
  const [language, setLanguage] = useState(languages[0] ?? "English");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selected = tours.find((t) => t.slug === tourSlug);

  // The API recalculates authoritative net pricing server-side from the
  // partner's tier. These client-side numbers mirror it for live preview.
  const preview = useMemo(() => {
    if (!selected) return null;
    const netPer = Math.round(selected.retail * (1 - discountPct / 100));
    return {
      netPer,
      total: netPer * pax,
      retailTotal: selected.retail * pax,
      saved: selected.retail * pax - netPer * pax,
    };
  }, [selected, pax, discountPct]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourSlug, travelDate, pax, language, notes }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to create quote");
      router.push(`/partners/quotes/${body.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create quote");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="tourSlug">Tour *</label>
            <select
              id="tourSlug"
              value={tourSlug}
              onChange={(e) => setTourSlug(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a tour…</option>
              {tours.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title} — {t.days} days (retail ${t.retail} pp)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="travelDate">Start date *</label>
            <input
              id="travelDate"
              type="date"
              required
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="pax">Pax *</label>
            <input
              id="pax"
              type="number"
              min={1}
              max={60}
              required
              value={pax}
              onChange={(e) => setPax(Math.max(1, Number(e.target.value)))}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="language">Guiding language *</label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input"
            >
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="notes">Client notes</label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input"
              placeholder="Rooming, children, dietary needs, budget ceiling…"
            />
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* LIVE PRICING */}
      <aside className="h-fit lg:sticky lg:top-24">
        <div className="card p-6">
          <h3 className="font-bold">Live net pricing</h3>
          {preview ? (
            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Retail pp</dt>
                <dd className="line-through text-gray-400">
                  ${selected!.retail}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Net pp (your tier)</dt>
                <dd className="font-bold text-brand-700">${preview.netPer}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2.5">
                <dt className="text-gray-500">Net total · {pax} pax</dt>
                <dd className="text-lg font-black text-brand-700">
                  ${preview.total.toLocaleString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Your client pays (suggest)</dt>
                <dd>${Math.round(selected!.retail * 1.0)} pp</dd>
              </div>
              <div className="flex justify-between rounded-lg bg-brand-50 px-3 py-2">
                <dt className="font-semibold text-brand-800">
                  You save vs retail
                </dt>
                <dd className="font-bold text-brand-700">
                  ${preview.saved.toLocaleString()}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              Select a tour to see live net pricing at your tier.
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !tourSlug}
            className="btn-primary mt-6 w-full disabled:opacity-60"
          >
            {saving ? "Creating…" : "Create quote"}
          </button>
          <p className="mt-3 text-xs leading-5 text-gray-500">
            Final pricing is confirmed by our ops team within one business day.
            Seasonal surcharges may apply (Jul–Sep, Christmas).
          </p>
        </div>
      </aside>
    </form>
  );
}
