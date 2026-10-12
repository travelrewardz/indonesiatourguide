"use client";

import { useRef, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  name?: string;
  defaultValue?: string;
  rows?: number;
  className?: string;
  required?: boolean;
};

/**
 * Markdown body editor with an "insert image from device" action: the picked
 * file goes to POST /api/uploads and `![caption](/uploads/…)` is spliced in at
 * the caret, so articles can include local photos without pasting URLs.
 */
export default function MarkdownContentEditor({
  name = "content",
  defaultValue = "",
  rows = 20,
  className = "input font-mono text-sm leading-6",
  required = false,
}: Props) {
  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Images must be 5 MB or smaller.");
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");

      const el = areaRef.current;
      if (el) {
        const caption = file.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "").slice(0, 60) || "photo";
        const snippet = `![${caption}](${data.url})`;
        const start = el.selectionStart ?? el.value.length;
        const end = el.selectionEnd ?? start;
        const before = el.value.slice(0, start);
        const glue = before && !before.endsWith("\n") ? "\n\n" : "";
        const next = before + glue + snippet + el.value.slice(end);
        // Write through the native setter so React keeps the uncontrolled field in sync.
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        setter?.call(el, next);
        el.dispatchEvent(new Event("input", { bubbles: true }));
        const caret = (before + glue + snippet).length;
        el.focus();
        el.setSelectionRange(caret, caret);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      <textarea
        ref={areaRef}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className={className}
        required={required}
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className={`btn-outline btn-sm cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? "Uploading…" : "Insert image from device"}
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={busy} tabIndex={-1} />
        </label>
        <span className="text-xs text-gray-500">Inserts <code>![caption](/uploads/…)</code> at the cursor</span>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
