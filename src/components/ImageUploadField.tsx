"use client";

import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;

type Props = {
  /** Renders a named field inside a server <form> (uncontrolled). */
  name?: string;
  /** Controlled value + change handler (e.g. the tour editor state). */
  value?: string;
  onChange?: (next: string) => void;
  defaultValue?: string;
  placeholder?: string;
  /** Extra classes for the text field — defaults to the shared `.input` style. */
  className?: string;
  /** Multi-line URL field: uploaded URLs are appended on their own line. */
  multiline?: boolean;
  /** Append the uploaded URL instead of replacing the current value. */
  append?: boolean;
  /** Row count for the multi-line field. */
  rows?: number;
  id?: string;
};

/**
 * Image URL field with an "upload from device" file picker.
 *
 * The picked file goes to `POST /api/uploads`; the returned `/uploads/…` URL is
 * written into the field (controlled via `value`/`onChange`, or the named
 * input/textarea itself when used inside a server-component form).
 */
export default function ImageUploadField({
  name,
  value,
  onChange,
  defaultValue = "",
  placeholder = "https://…",
  className = "input",
  multiline = false,
  append = false,
  rows = 3,
  id,
}: Props) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [brokenPreview, setBrokenPreview] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  const current = controlled ? value : internal;
  const trimmed = current.trim();

  useEffect(() => {
    setBrokenPreview(false);
  }, [trimmed]);

  function apply(next: string) {
    if (controlled) {
      onChange?.(next);
      return;
    }
    setInternal(next);
    // Uncontrolled field: keep the DOM value in sync so the server form posts it.
    if (multiline) {
      if (areaRef.current) areaRef.current.value = next;
    } else if (inputRef.current) {
      inputRef.current.value = next;
    }
  }

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
      const url = String(data.url);
      if (append) apply(current ? `${current.replace(/\s*$/, "")}\n${url}` : url);
      else apply(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1">
      {multiline ? (
        <textarea
          id={id}
          ref={areaRef}
          name={name}
          defaultValue={controlled ? undefined : defaultValue}
          value={controlled ? value : undefined}
          rows={rows}
          className={className}
          placeholder={placeholder}
          onChange={(e) => controlled && onChange?.(e.target.value)}
        />
      ) : (
        <input
          id={id}
          ref={inputRef}
          name={name}
          className={className}
          placeholder={placeholder}
          defaultValue={controlled ? undefined : defaultValue}
          value={controlled ? value : undefined}
          onChange={(e) => controlled && onChange?.(e.target.value)}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className={`btn-outline btn-sm cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {busy ? "Uploading…" : "Upload from device"}
          <input type="file" accept="image/*" className="sr-only" onChange={handleFile} disabled={busy} tabIndex={-1} />
        </label>

        {trimmed && !multiline && !brokenPreview && (
          <img
            key={trimmed}
            src={trimmed}
            alt=""
            width={48}
            height={32}
            loading="lazy"
            className="h-8 w-12 rounded border border-gray-200 object-cover"
            onError={() => setBrokenPreview(true)}
          />
        )}

        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
