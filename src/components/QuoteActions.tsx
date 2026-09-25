"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuoteStatus } from "@/lib/types";

export default function QuoteActions({
  quoteId,
  status,
}: {
  quoteId: string;
  status: QuoteStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateStatus(next: QuoteStatus) {
    setBusy(true);
    await fetch("/api/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId, status: next }),
    });
    setBusy(false);
    router.refresh();
  }

  const actions: { label: string; next: QuoteStatus; style: string }[] = [];
  if (status === "draft") {
    actions.push({ label: "Send to Indonesia Tour Guide", next: "sent", style: "btn-primary" });
  }
  if (status === "sent" || status === "negotiating") {
    actions.push({
      label: "Mark negotiating",
      next: "negotiating",
      style: "btn-outline",
    });
  }
  if (status === "accepted") {
    actions.push({
      label: "✔ Accepted — request booking",
      next: "accepted",
      style: "btn-primary",
    });
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-5">
      <div className="flex flex-col gap-2">
        {actions.length === 0 && status === "lost" && (
          <p className="text-sm text-gray-500">This quote was marked lost.</p>
        )}
        {actions.map((a) => (
          <button
            key={a.next}
            disabled={busy}
            className={`${a.style} w-full disabled:opacity-60`}
            onClick={() => updateStatus(a.next)}
          >
            {a.label}
          </button>
        ))}
        {(status === "sent" || status === "negotiating" || status === "draft") && (
          <button
            disabled={busy}
            className="btn-ghost w-full text-sm text-red-600 hover:bg-red-50"
            onClick={() => updateStatus("lost")}
          >
            Mark as lost
          </button>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-gray-500">
        When your client accepts, our ops team confirms availability and the
        booking appears under Bookings with a confirmation code.
      </p>
    </div>
  );
}
