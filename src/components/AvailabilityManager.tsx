"use client";

import { useCallback, useEffect, useState } from "react";
import { setAvailabilityAction } from "@/lib/actions";
import { fmtDate } from "@/lib/format";

type TourOption = { id: string; name: string };
type Avail = { date: string; status: string; capacity: number; booked: number; remaining: number };

export default function AvailabilityManager({
  tours, readOnly = false,
}: {
  tours: { id: string; slug: string; title: string; max_pax: number; options: TourOption[] }[];
  readOnly?: boolean;
}) {
  const [tourId, setTourId] = useState(tours[0]?.id ?? "");
  const [optionId, setOptionId] = useState("");
  const [rows, setRows] = useState<Avail[]>([]);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ date: "", slots: "", status: "AVAILABLE" });

  const tour = tours.find((t) => t.id === tourId);

  const load = useCallback(async () => {
    if (!tourId) return;
    const params = new URLSearchParams({ days: "60" });
    if (optionId) params.set("optionId", optionId);
    const res = await fetch(`/api/tours/${tour?.slug ?? ""}/availability?${params}`);
    if (res.ok) {
      const json = await res.json();
      setRows(json.dates as Avail[]);
    }
  }, [tourId, optionId, tour?.slug]);

  useEffect(() => {
    load();
  }, [load]);

  async function apply(date: string, patch: { availableSlots?: number; status?: "AVAILABLE" | "LIMITED" | "SOLD_OUT" | "CLOSED" }) {
    setBusy(date);
    setMsg("");
    try {
      await setAvailabilityAction({ tourId, optionId: optionId || null, date, ...patch });
      setMsg(`Saved ${date}`);
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy("");
    }
  }

  async function applyForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.date) return;
    await apply(form.date, {
      availableSlots: form.slots ? Number(form.slots) : undefined,
      status: form.status as "AVAILABLE",
    });
    setForm({ date: "", slots: "", status: "AVAILABLE" });
  }

  if (!tours.length) return <div className="card p-8 text-sm text-gray-600">No tours yet — create a tour first.</div>;

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="av-tour">Tour</label>
            <select id="av-tour" className="input" value={tourId} onChange={(e) => { setTourId(e.target.value); setOptionId(""); }}>
              {tours.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="av-option">Option</label>
            <select id="av-option" className="input" value={optionId} onChange={(e) => setOptionId(e.target.value)}>
              <option value="">Tour-level (default)</option>
              {tour?.options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        </div>

        {!readOnly && (
          <form onSubmit={applyForm} className="mt-4 grid gap-3 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <label className="label" htmlFor="av-date">Date</label>
              <input id="av-date" type="date" required className="input" value={form.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="av-slots">Capacity</label>
              <input id="av-slots" type="number" min={0} className="input" placeholder={String(tour?.max_pax ?? 12)}
                value={form.slots} onChange={(e) => setForm({ ...form, slots: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="av-status">Status</label>
              <select id="av-status" className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="AVAILABLE">Open</option>
                <option value="LIMITED">Limited</option>
                <option value="SOLD_OUT">Sold out</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">Apply</button>
            </div>
          </form>
        )}
        {msg && <p className="mt-2 text-sm text-brand-600">{msg}</p>}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th><th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Booked</th><th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Remaining</th>{!readOnly && <th className="px-4 py-3">Quick actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.date} className={r.status === "SOLD_OUT" || r.status === "CLOSED" ? "bg-red-50/50" : r.status === "LIMITED" ? "bg-amber-50/60" : ""}>
                <td className="px-4 py-2.5 font-medium">{fmtDate(r.date)}</td>
                <td className="px-4 py-2.5">
                  <span className={`badge ${r.status === "AVAILABLE" ? "bg-brand-100 text-brand-700" : r.status === "LIMITED" ? "bg-amber-100 text-amber-800" : r.status === "SOLD_OUT" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-600"}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5">{r.booked}</td>
                <td className="px-4 py-2.5">{r.capacity}</td>
                <td className="px-4 py-2.5 font-semibold">{r.remaining}</td>
                {!readOnly && (
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      <button type="button" disabled={busy === r.date} onClick={() => apply(r.date, { status: "CLOSED" })}
                        className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50">Close</button>
                      <button type="button" disabled={busy === r.date} onClick={() => apply(r.date, { status: "AVAILABLE" })}
                        className="rounded border border-brand-200 px-2 py-1 text-xs text-brand-700 hover:bg-brand-50">Open</button>
                      <button type="button" disabled={busy === r.date} onClick={() => apply(r.date, { availableSlots: r.booked })}
                        className="rounded border border-gray-200 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">Sell out</button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">
        Every booking atomically reserves capacity here — remaining spots shown to customers are always live.
      </p>
    </div>
  );
}
