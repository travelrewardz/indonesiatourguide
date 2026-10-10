"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/lib/format";
import type { TourOption } from "@/lib/types";

type DateAvail = { date: string; status: string; remaining: number; capacity: number };
type Quote = {
  pricing: { unitPrice: number; total: number; discount: number; priceLabel: string | null };
  display: { currency: string; unit: number; total: number; discount: number };
  options: { id: string; price: number }[];
  availability: DateAvail;
  canBook: boolean;
  role: string;
};

export default function BookingPanel({
  tourSlug, options, currency, minPax, maxPax, labels, whatsappUrl,
}: {
  tourSlug: string;
  options: TourOption[];
  currency: string;
  minPax: number;
  maxPax: number;
  labels: {
    selectOption: string; selectDate: string; adults: string; children: string;
    bookNow: string; liveTotal: string; from: string; perPerson: string;
    available: string; limited: string; soldOut: string; closed: string; whatsapp: string;
  };
  whatsappUrl: string;
}) {
  const router = useRouter();
  const [optionId, setOptionId] = useState<string>(options[0]?.id ?? "");
  const [date, setDate] = useState("");
  const [adults, setAdults] = useState(Math.max(1, minPax));
  const [children, setChildren] = useState(0);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [calendar, setCalendar] = useState<DateAvail[]>([]);

  const pax = adults + children;

  const fetchQuote = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ date, pax: String(pax), currency });
      if (optionId) params.set("optionId", optionId);
      const res = await fetch(`/api/tours/${tourSlug}/quote?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not fetch price");
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fetch price");
    } finally {
      setLoading(false);
    }
  }, [tourSlug, optionId, date, pax, currency]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // availability calendar for the next 30 days
  useEffect(() => {
    const params = new URLSearchParams({ days: "30" });
    if (optionId) params.set("optionId", optionId);
    fetch(`/api/tours/${tourSlug}/availability?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.dates && setCalendar(d.dates))
      .catch(() => {});
  }, [tourSlug, optionId]);

  const statusLabel = useMemo(() => {
    const s = quote?.availability.status;
    if (!s) return null;
    if (s === "AVAILABLE") return { text: labels.available, cls: "bg-brand-100 text-brand-700" };
    if (s === "LIMITED") return { text: `${labels.limited} (${quote?.availability.remaining ?? 0})`, cls: "bg-amber-100 text-amber-800" };
    if (s === "SOLD_OUT") return { text: labels.soldOut, cls: "bg-red-100 text-red-700" };
    return { text: labels.closed, cls: "bg-gray-200 text-gray-600" };
  }, [quote, labels]);

  function proceed() {
    const params = new URLSearchParams();
    if (optionId) params.set("option", optionId);
    if (date) params.set("date", date);
    params.set("adults", String(adults));
    if (children) params.set("children", String(children));
    router.push(`/book/${tourSlug}?${params}`);
  }

  const soonest = calendar.find((c) => c.status === "AVAILABLE" || c.status === "LIMITED");

  // All displayed money values come from the server-issued quote (server converts).
  const fmt = (value: number | undefined | null): string => {
    if (value == null) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency,
      maximumFractionDigits: currency === "IDR" ? 0 : 2,
      minimumFractionDigits: currency === "IDR" ? 0 : 0,
    }).format(value);
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-gray-100 bg-sand-50 px-5 py-4">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">From / person</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-brand-700">
                {fmt(quote?.display.unit)}
              </span>
              <span className="text-sm text-gray-500">{labels.perPerson}</span>
            </div>
          </div>
          {quote?.pricing.priceLabel && (
            <span className="badge bg-accent/10 text-accent-dark">{quote.pricing.priceLabel}</span>
          )}
        </div>
        {quote && quote.pricing.discount > 0 && (
          <div className="mt-1 text-xs text-gray-500">
            Total for {pax}: <b>{fmt(quote.display.total)}</b> (save {fmt(quote.display.discount)})
          </div>
        )}
      </div>

      <div className="space-y-4 p-5">
        {options.length > 0 && (
          <div>
            <label className="label" htmlFor="bp-option">{labels.selectOption}</label>
            <select id="bp-option" className="input" value={optionId} onChange={(e) => setOptionId(e.target.value)}>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} — {fmt(quote?.options.find((q) => q.id === o.id)?.price ?? null)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="label" htmlFor="bp-date">{labels.selectDate}</label>
          <input
            id="bp-date"
            type="date"
            className="input"
            value={date}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
          />
          {!date && soonest && (
            <button
              type="button"
              className="mt-1.5 text-xs font-medium text-brand-600 hover:underline"
              onClick={() => setDate(soonest.date)}
            >
              Next available: {soonest.date}
            </button>
          )}
          {date && calendar.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {calendar.slice(0, 14).map((d) => (
                <button
                  key={d.date}
                  type="button"
                  disabled={d.status === "SOLD_OUT" || d.status === "CLOSED"}
                  onClick={() => setDate(d.date)}
                  className={cx(
                    "rounded border px-2 py-1 text-[11px] font-medium transition-colors",
                    d.date === date ? "border-brand-600 bg-brand-600 text-white" :
                    d.status === "SOLD_OUT" || d.status === "CLOSED" ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through" :
                    d.status === "LIMITED" ? "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-500" :
                    "border-brand-200 bg-brand-50 text-brand-700 hover:border-brand-500",
                  )}
                  title={`${d.date} — ${d.status}`}
                >
                  {d.date.slice(8)}/{d.date.slice(5, 7)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="bp-adults">{labels.adults}</label>
            <select id="bp-adults" className="input" value={adults} onChange={(e) => setAdults(Number(e.target.value))}>
              {Array.from({ length: Math.min(20, maxPax) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="bp-children">{labels.children}</label>
            <select id="bp-children" className="input" value={children} onChange={(e) => setChildren(Number(e.target.value))}>
              {Array.from({ length: Math.min(10, Math.max(0, maxPax - adults + 1)) }, (_, i) => i).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {statusLabel && (
          <div className={cx("rounded-lg px-3 py-2 text-center text-sm font-semibold", statusLabel.cls)}>
            {statusLabel.text}
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={proceed}
          disabled={!date || loading || !quote?.canBook}
          className="btn-accent w-full py-3 text-base"
        >
          {!date ? labels.selectDate : !quote?.canBook ? labels.soldOut : `${labels.bookNow} · ${loading ? "…" : fmt(quote?.display.total)}`}
        </button>

        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="btn-outline w-full border-green-500 text-green-700 hover:bg-green-50">
          💬 {labels.whatsapp}
        </a>
      </div>
    </div>
  );
}

