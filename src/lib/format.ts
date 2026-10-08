/** Display formatting helpers (server + client safe). */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function money(amount: number, currency = "USD"): string {
  const noDecimals = currency === "IDR";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : 2,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(amount);
}

export function plain(amount: number, currency = "USD"): string {
  const noDecimals = currency === "IDR";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: noDecimals ? 0 : 0,
    maximumFractionDigits: noDecimals ? 0 : 0,
  }).format(noDecimals ? Math.round(amount) : amount);
}

export function fmtDate(iso: string, locale = "en"): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function fmtDateLong(iso: string, locale = "en"): string {
  try {
    return new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function fmtDateTime(iso: string, locale = "en"): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function relativeDay(iso: string): string {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}
