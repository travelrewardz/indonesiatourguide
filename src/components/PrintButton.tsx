"use client";

export default function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary btn-sm no-print">
      🖨 {label}
    </button>
  );
}
