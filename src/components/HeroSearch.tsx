"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Destination } from "@/lib/types";

const CATEGORIES = ["Adventure", "Culture", "Nature", "Beach", "Diving", "Trekking", "Family", "Honeymoon", "Luxury", "Wildlife", "Volcano", "Waterfall", "Cycling", "Snorkeling"];

export default function HeroSearch({
  destinations,
  labels,
}: {
  destinations: Pick<Destination, "slug" | "name">[];
  labels: { destination: string; date: string; travelers: string; type: string; any: string; submit: string; plan: string };
}) {
  const router = useRouter();
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [travelers, setTravelers] = useState("");
  const [category, setCategory] = useState("");

  function search() {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (date) params.set("date", date);
    if (travelers) params.set("travelers", travelers);
    if (category) params.set("category", category);
    router.push(`/tours${params.toString() ? `?${params}` : ""}`);
  }

  function planTrip() {
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (date) params.set("date", date);
    if (travelers) params.set("pax", travelers);
    router.push(`/contact?type=tailor_made${params.toString() ? `&${params}` : ""}`);
  }

  return (
    <div className="mt-8 w-full max-w-4xl">
      <div className="glass-card grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/80" htmlFor="hs-dest">
            {labels.destination}
          </label>
          <select id="hs-dest" value={destination} onChange={(e) => setDestination(e.target.value)}
            className="w-full rounded-lg border-0 bg-white/95 px-3 py-2.5 text-sm text-ink focus:ring-2 focus:ring-accent">
            <option value="">{labels.any}</option>
            {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/80" htmlFor="hs-date">
            {labels.date}
          </label>
          <input id="hs-date" type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border-0 bg-white/95 px-3 py-2.5 text-sm text-ink focus:ring-2 focus:ring-accent" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/80" htmlFor="hs-pax">
            {labels.travelers}
          </label>
          <select id="hs-pax" value={travelers} onChange={(e) => setTravelers(e.target.value)}
            className="w-full rounded-lg border-0 bg-white/95 px-3 py-2.5 text-sm text-ink focus:ring-2 focus:ring-accent">
            <option value="">{labels.any}</option>
            {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-white/80" htmlFor="hs-cat">
            {labels.type}
          </label>
          <select id="hs-cat" value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border-0 bg-white/95 px-3 py-2.5 text-sm text-ink focus:ring-2 focus:ring-accent">
            <option value="">{labels.any}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button type="button" onClick={search} className="btn-accent flex-1 py-2.5">
            {labels.submit}
          </button>
        </div>
      </div>
      <div className="mt-3 flex justify-center">
        <button type="button" onClick={planTrip} className="glass-card rounded-full px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20">
          ✈ {labels.plan}
        </button>
      </div>
    </div>
  );
}
