"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      className="mx-auto mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/tours?q=${encodeURIComponent(q)}`);
      }}
    >
      <div className="relative flex-1">
        <svg
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tours, destinations..."
          aria-label="Search tours and destinations"
          className="h-14 w-full rounded-full border-0 bg-white pl-12 pr-5 text-sm text-ink shadow-xl placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-accent/40"
        />
      </div>
      <button
        type="submit"
        className="btn btn-accent h-14 rounded-full px-8 text-base shadow-xl"
      >
        Explore Tours
      </button>
    </form>
  );
}
