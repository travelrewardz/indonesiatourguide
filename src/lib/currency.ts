import { all } from "./db";

/**
 * Multi-currency display layer. The base (and charged) currency is USD;
 * conversion is display-only — the server always computes booking totals in
 * the base currency, and the client never determines what is charged.
 */

export type RateRow = { currency: string; name: string; symbol: string; rate_to_usd: number };
export type Rates = Record<string, RateRow>;

let cache: { rates: Rates; at: number } | null = null;

export function getRates(): Rates {
  if (cache && Date.now() - cache.at < 60_000) return cache.rates;
  const rows = all<RateRow>("SELECT currency, name, symbol, rate_to_usd FROM fx_rates");
  const rates: Rates = {};
  for (const r of rows) rates[r.currency] = r;
  cache = { rates, at: Date.now() };
  return rates;
}

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "AUD", "SGD", "IDR"];

/** Converts a USD amount into a display currency using the stored FX rate. */
export function convert(usd: number, currency: string): number {
  const rate = getRates()[currency];
  if (!rate) return usd;
  const value = usd * rate.rate_to_usd;
  return currency === "IDR" ? Math.round(value / 1000) * 1000 : Math.round(value * 100) / 100;
}

export function displayMoney(usd: number, currency: string): string {
  return moneyIn(convert(usd, currency), currency);
}

function moneyIn(amount: number, currency: string): string {
  const noDecimals = currency === "IDR";
  return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: noDecimals ? 0 : 0,
    maximumFractionDigits: noDecimals ? 0 : 2,
  }).format(amount);
}
