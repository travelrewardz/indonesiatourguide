"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuoteAction } from "@/lib/actions";

export default function QuoteBuilder({ tours }: { tours: { id: string; title: string; base_price: number; agent_price: number | null; sale_price: number | null; agent_discount_pct: number | null }[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("busy");
    const fd = new FormData(e.currentTarget);
    const res = await createQuoteAction(fd);
    if (res.ok) {
      setStatus("done");
      setMessage(`Quote ${res.reference} created and saved.`);
      router.refresh();
    } else {
      setStatus("error");
      setMessage(res.error ?? "Failed");
    }
  }

  if (status === "done") {
    return (
      <div className="card p-6 text-center">
        <div className="text-2xl">✅</div>
        <p className="mt-2 font-semibold">{message}</p>
        <button type="button" className="btn-outline btn-sm mt-3" onClick={() => setStatus("idle")}>Create another</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card p-6">
      <h3 className="font-bold">Create a quote</h3>
      <p className="mt-1 text-xs text-gray-500">Priced at your net rate — saved to your quotes list with a reference.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="qb-tour">Tour</label>
          <select id="qb-tour" name="tourId" required className="input">
            <option value="">Select a tour…</option>
            {tours.map((t) => {
              const retail = t.sale_price ?? t.base_price;
              const net =
                t.agent_price ??
                (t.agent_discount_pct != null && t.agent_discount_pct > 0
                  ? Math.round(retail * (1 - t.agent_discount_pct / 100))
                  : retail);
              return (
                <option key={t.id} value={t.id}>
                  {t.title} — net ${net}/pp
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="qb-date">Travel date</label>
          <input id="qb-date" name="travelDate" type="date" required className="input" min={new Date().toISOString().slice(0, 10)} />
        </div>
        <div>
          <label className="label" htmlFor="qb-pax">Pax</label>
          <input id="qb-pax" name="pax" type="number" min={1} max={100} defaultValue={2} required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="qb-customer">Customer / group name</label>
          <input id="qb-customer" name="customerName" className="input" placeholder="e.g. Fernandez family" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="qb-notes">Notes</label>
          <textarea id="qb-notes" name="notes" rows={2} className="input" placeholder="Room type, dietary needs, flight times…" />
        </div>
      </div>
      {status === "error" && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>}
      <button type="submit" disabled={status === "busy"} className="btn-primary mt-4">
        {status === "busy" ? "Creating…" : "Create quote"}
      </button>
    </form>
  );
}
