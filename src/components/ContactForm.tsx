"use client";

import { useState } from "react";
import { LANGUAGES, TOURS } from "@/data/catalog";

export default function ContactForm({
  defaultTour,
  formAction,
  title,
  subtitle,
  submitLabel,
  showCompany = false,
}: {
  defaultTour?: string;
  formAction: string;
  title: string;
  subtitle?: string;
  submitLabel: string;
  showCompany?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">(
    "idle"
  );
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus("sending");
    setError("");
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch(formAction, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error || `Request failed (${res.status})`);
      }
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "ok") {
    return (
      <div className="card p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-2xl text-brand-700">
          ✓
        </div>
        <h3 className="mt-4 text-xl font-bold">Request received!</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-600">
          Our team will reply within one business day with availability and
          pricing. {showCompany && "You can also log into the partner portal to track quotes."}
        </p>
        <button
          className="btn-outline mt-6"
          onClick={() => setStatus("idle")}
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <h3 className="text-xl font-bold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {showCompany && (
          <div>
            <label className="label" htmlFor="companyName">Company name *</label>
            <input id="companyName" name="companyName" required className="input" placeholder="Atlas Tours Ltd" />
          </div>
        )}
        <div>
          <label className="label" htmlFor="name">Full name *</label>
          <input id="name" name="name" required className="input" placeholder="Jane Doe" />
        </div>
        <div>
          <label className="label" htmlFor="email">Email *</label>
          <input id="email" name="email" type="email" required className="input" placeholder="jane@agency.com" />
        </div>
        <div>
          <label className="label" htmlFor="country">Country</label>
          <input id="country" name="country" className="input" placeholder="Spain" />
        </div>
        {showCompany && (
          <div>
            <label className="label" htmlFor="phone">Phone / WhatsApp</label>
            <input id="phone" name="phone" className="input" placeholder="+34 ..." />
          </div>
        )}
        <div>
          <label className="label" htmlFor="tourSlug">Tour of interest</label>
          <select id="tourSlug" name="tourSlug" defaultValue={defaultTour ?? ""} className="input">
            <option value="">Tailor-made / not sure yet</option>
            {TOURS.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="travelDate">Approx. travel date</label>
          <input id="travelDate" name="travelDate" type="date" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="pax">Pax</label>
          <input id="pax" name="pax" type="number" min={1} max={120} className="input" placeholder="2" />
        </div>
        <div>
          <label className="label" htmlFor="language">Guiding language</label>
          <select id="language" name="language" className="input">
            <option value="">Any language</option>
            {Object.values(LANGUAGES).map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="message">Trip details *</label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          className="input"
          placeholder={
            showCompany
              ? "Rooming, child policy, budget, special requests..."
              : "Tell us about your dream trip — dates, interests, pace..."
          }
        />
      </div>

      {status === "error" && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-primary mt-6 w-full disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
