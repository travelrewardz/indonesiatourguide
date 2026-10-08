"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SandboxPayButtons({
  paymentId, paidSignature, failedSignature, bookingUrl, amountLabel,
}: {
  paymentId: string;
  paidSignature: string;
  failedSignature: string;
  bookingUrl: string;
  amountLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "paid" | "failed">("");

  async function fire(status: "PAID" | "FAILED") {
    setBusy(status === "PAID" ? "paid" : "failed");
    try {
      const res = await fetch("/api/payments/webhook/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          status,
          signature: status === "PAID" ? paidSignature : failedSignature,
          transactionId: `SBX-${Date.now()}`,
        }),
      });
      if (!res.ok) throw new Error("webhook rejected");
      router.push(bookingUrl);
      router.refresh();
    } catch {
      setBusy("");
      alert("Payment simulation failed — please retry.");
    }
  }

  return (
    <div className="space-y-3">
      <button type="button" onClick={() => fire("PAID")} disabled={busy !== ""} className="btn-accent w-full py-3 text-base">
        {busy === "paid" ? "Processing…" : `✓ Simulate successful payment — ${amountLabel}`}
      </button>
      <button type="button" onClick={() => fire("FAILED")} disabled={busy !== ""} className="btn-outline w-full border-gray-300 text-gray-600">
        {busy === "failed" ? "Processing…" : "Simulate failed / declined payment"}
      </button>
      <p className="text-center text-xs text-gray-500">
        Sandbox mode: these buttons fire the same signed webhook a real gateway would — signature checked,
        booking confirmed, notifications queued.
      </p>
    </div>
  );
}
