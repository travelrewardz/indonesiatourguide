import { cookies } from "next/headers";
import { isLocale, type Locale } from "./i18n";

/** Resolved per-request UI preferences (cookie-driven, no DB writes). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get("itg_locale")?.value;
  return isLocale(raw) ? raw : "en";
}

export async function getDisplayCurrency(): Promise<string> {
  const store = await cookies();
  const raw = store.get("itg_currency")?.value;
  return raw && ["USD", "EUR", "GBP", "AUD", "SGD", "IDR"].includes(raw) ? raw : "USD";
}
