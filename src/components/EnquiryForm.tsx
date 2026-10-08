"use client";

import { useState } from "react";

type EnquiryType = "contact" | "tailor_made" | "quote";

export default function EnquiryForm({
  type = "contact",
  tourSlug,
  defaults = {},
  submitLabel = "Send request",
}: {
  type?: EnquiryType;
  tourSlug?: string;
  defaults?: Record<string, string>;
  submitLabel?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { type, message: String(form.get("message") ?? "") };
    for (const key of ["name", "email", "phone", "country", "destination", "travel_date", "budget", "interests", "accommodation"]) {
      const v = form.get(key);
      if (typeof v === "string" && v.trim()) payload[key] = v.trim();
    }
    const pax = String(form.get("pax") ?? "");
    if (pax) payload.pax = Number(pax);
    if (tourSlug) payload.tour_slug = tourSlug;

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-2xl">✅</div>
        <h3 className="mt-4 text-xl font-bold">Request received</h3>
        <p className="mt-2 text-sm text-gray-600">
          A local planner will reply within 24 hours (Mon–Sat, WITA). We&apos;ve also emailed you a copy.
        </p>
      </div>
    );
  }

  const isTailor = type === "tailor_made" || type === "quote";

  return (
    <form onSubmit={onSubmit} className="card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor={`ef-name-${type}`}>Full name *</label>
          <input id={`ef-name-${type}`} name="name" required minLength={2} defaultValue={defaults.name ?? ""} className="input" placeholder="Your name" />
        </div>
        <div>
          <label className="label" htmlFor={`ef-email-${type}`}>Email *</label>
          <input id={`ef-email-${type}`} name="email" type="email" required defaultValue={defaults.email ?? ""} className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor={`ef-phone-${type}`}>Phone / WhatsApp</label>
          <input id={`ef-phone-${type}`} name="phone" defaultValue={defaults.phone ?? ""} className="input" placeholder="+1 555 000 000" />
        </div>
        <div>
          <label className="label" htmlFor={`ef-country-${type}`}>Country</label>
          <input id={`ef-country-${type}`} name="country" defaultValue={defaults.country ?? ""} className="input" placeholder="Where are you from?" />
        </div>

        {isTailor && (
          <>
            <div>
              <label className="label" htmlFor={`ef-dest-${type}`}>Destination(s)</label>
              <input id={`ef-dest-${type}`} name="destination" defaultValue={defaults.destination ?? ""} className="input" placeholder="e.g. Bali, Komodo, Yogyakarta" />
            </div>
            <div>
              <label className="label" htmlFor={`ef-date-${type}`}>Travel date</label>
              <input id={`ef-date-${type}`} name="travel_date" type="date" defaultValue={defaults.travel_date ?? ""} className="input" />
            </div>
            <div>
              <label className="label" htmlFor={`ef-pax-${type}`}>Number of travellers</label>
              <input id={`ef-pax-${type}`} name="pax" type="number" min={1} max={100} defaultValue={defaults.pax ?? ""} className="input" placeholder="2" />
            </div>
            <div>
              <label className="label" htmlFor={`ef-budget-${type}`}>Budget per person</label>
              <select id={`ef-budget-${type}`} name="budget" defaultValue={defaults.budget ?? ""} className="input">
                <option value="">Select a range</option>
                <option>Under USD 500</option>
                <option>USD 500–1,000</option>
                <option>USD 1,000–2,000</option>
                <option>USD 2,000–3,500</option>
                <option>USD 3,500+</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor={`ef-accom-${type}`}>Accommodation level</label>
              <select id={`ef-accom-${type}`} name="accommodation" defaultValue={defaults.accommodation ?? ""} className="input">
                <option value="">Select level</option>
                <option>Hostels / budget</option>
                <option>3★ comfort</option>
                <option>4★ boutique</option>
                <option>5★ luxury / villas</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor={`ef-interests-${type}`}>Interests</label>
              <input id={`ef-interests-${type}`} name="interests" defaultValue={defaults.interests ?? ""} className="input" placeholder="Culture, diving, hiking, photography…" />
            </div>
          </>
        )}
      </div>

      <div className="mt-4">
        <label className="label" htmlFor={`ef-msg-${type}`}>
          {isTailor ? "Special requests & anything we should know *" : "Message *"}
        </label>
        <textarea id={`ef-msg-${type}`} name="message" required minLength={5} rows={5} className="input" placeholder="Tell us about your trip…" />
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button type="submit" disabled={status === "loading"} className="btn-primary mt-4 w-full sm:w-auto">
        {status === "loading" ? "Sending…" : submitLabel}
      </button>
      <p className="mt-3 text-xs text-gray-500">We reply within 24 hours. Your details are used only to answer your request.</p>
    </form>
  );
}
