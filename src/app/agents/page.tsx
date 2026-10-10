import Link from "next/link";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { fmtDate } from "@/lib/format";
import { displayMoney } from "@/lib/currency";
import { getDisplayCurrency } from "@/lib/prefs";
import QuoteBuilder from "@/components/QuoteBuilder";
import { setQuoteStatusFormAction } from "@/lib/actions";
import type { Agent, Booking, Quote, Tour } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "For Travel Agencies — Net Rates & B2B Booking Portal",
  description:
    "Sell Indonesia with confidence: B2B net rates, instant quotes, commission tracking, vouchers and direct booking with verified local operators.",
  path: "/agents",
});

const TIERS = [
  { name: "Standard", discount: "10%", min: "0–49 pax / year", color: "bg-gray-100 text-gray-700" },
  { name: "Silver", discount: "15%", min: "50–149 pax / year", color: "bg-slate-100 text-slate-700" },
  { name: "Gold", discount: "20%", min: "150–399 pax / year", color: "bg-amber-100 text-amber-800" },
  { name: "Platinum", discount: "25%", min: "400+ pax / year", color: "bg-brand-100 text-brand-800" },
];

export default async function AgentsPage() {
  const session = await getSessionUser();
  const isAgent = session && (session.role === "TRAVEL_AGENT" || session.role === "ADMIN" || session.role === "SUPER_ADMIN");

  if (isAgent) return <AgentPortal userId={session!.id} />;

  // ---------------- public B2B landing ----------------
  return (
    <div>
      <section className="bg-ink py-20 text-white">
        <div className="container-x grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.25em] text-accent">Business to business</div>
            <h1 className="font-display mt-3 text-4xl font-medium leading-tight sm:text-5xl">
              Sell Indonesia with <em className="text-accent">local net rates</em>
            </h1>
            <p className="mt-5 max-w-xl leading-7 text-white/80">
              Give your clients the archipelago — from Bromo sunrises to Komodo sailing — with contracted net rates,
              instant quotes, live availability and one partner for the whole destination.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/register?role=agent" className="btn-accent px-6 py-3">Apply for a trade account</Link>
              <Link href="/login" className="btn-white px-6 py-3">Agent login</Link>
            </div>
            <p className="mt-3 text-xs text-white/50">Approval within one business day · No minimum commitments</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              ["Net rates", "Up to 25% off retail on every tour"],
              ["Instant quotes", "Branded quote references in seconds"],
              ["Live availability", "Real capacity — no overselling"],
              ["Vouchers", "QR vouchers with your agency name"],
            ].map(([t, d]) => (
              <div key={t} className="glass-card p-5">
                <div className="font-bold text-accent">{t}</div>
                <div className="mt-1 text-sm text-white/75">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-x">
          <h2 className="font-display text-center text-3xl font-medium">Commission tiers</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tier) => (
              <div key={tier.name} className="card p-6 text-center">
                <span className={`badge ${tier.color}`}>{tier.name}</span>
                <div className="font-display mt-4 text-4xl font-semibold text-brand-700">{tier.discount}</div>
                <div className="mt-1 text-sm font-medium text-gray-600">net discount vs retail</div>
                <div className="mt-3 text-xs text-gray-400">{tier.min}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sand-50 py-16">
        <div className="container-x grid gap-8 lg:grid-cols-3">
          {[
            ["1 · Register", "Create your trade account with company details. Our team verifies and unlocks net rates — usually same day."],
            ["2 · Quote & book", "Browse live net rates, generate quotes for your clients, then convert accepted quotes into confirmed bookings with QR vouchers."],
            ["3 · Earn", "Commission is tracked per booking and paid out monthly, or take the net rate and invoice your client yourself."],
          ].map(([t, d]) => (
            <div key={t} className="card p-6">
              <div className="font-bold text-brand-700">{t}</div>
              <p className="mt-2 text-sm leading-6 text-gray-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="container-x">
          <h2 className="font-display text-3xl font-medium">Ready to add Indonesia to your portfolio?</h2>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/register?role=agent" className="btn-primary px-6 py-3">Create agency account</Link>
            <Link href="/contact" className="btn-outline px-6 py-3">Talk to our B2B team</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ------------------------------------------------------------- agent portal
async function AgentPortal({ userId }: { userId: string }) {
  const currency = await getDisplayCurrency();
  const agent = get<Agent>("SELECT * FROM agents WHERE user_id = ?", userId);
  if (!agent) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-xl font-bold">No agency profile linked</h1>
        <p className="mt-2 text-sm text-gray-600">Register as a travel agency to unlock net rates.</p>
        <Link href="/register?role=agent" className="btn-primary mt-4">Register agency</Link>
      </div>
    );
  }

  const approved = agent.status === "APPROVED";
  const tours = all<Tour & { option_from: number | null }>(
    `SELECT t.*, (SELECT MIN(price) FROM tour_options o WHERE o.tour_id = t.id) AS option_from
     FROM tours t WHERE t.status = 'PUBLISHED' ORDER BY t.featured DESC, t.rating DESC LIMIT 40`,
  );
  const quotes = all<Quote & { tour_title: string }>(
    `SELECT q.*, t.title AS tour_title FROM quotes q JOIN tours t ON t.id = q.tour_id
     WHERE q.agent_id = ? ORDER BY q.created_at DESC LIMIT 20`, agent.id,
  );
  const bookings = all<Booking & { tour_title: string }>(
    `SELECT b.*, t.title AS tour_title FROM bookings b JOIN tours t ON t.id = b.tour_id
     WHERE b.agent_id = ? ORDER BY b.created_at DESC LIMIT 20`, agent.id,
  );
  const stats = {
    quotes: get<{ c: number }>("SELECT COUNT(*) AS c FROM quotes WHERE agent_id = ?", agent.id)?.c ?? 0,
    bookings: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE agent_id = ?", agent.id)?.c ?? 0,
    value: get<{ s: number | null }>("SELECT SUM(total_price) AS s FROM bookings WHERE agent_id = ? AND payment_status = 'PAID'", agent.id)?.s ?? 0,
    commission: get<{ s: number | null }>("SELECT SUM(commission) AS s FROM bookings WHERE agent_id = ? AND payment_status = 'PAID'", agent.id)?.s ?? 0,
  };

  return (
    <div className="bg-gray-50">
      <div className="bg-ink py-8 text-white">
        <div className="container-x">
          <div className="text-sm text-white/60"><Link href="/" className="hover:text-accent">Home</Link> / Agency portal</div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-medium">{agent.company}</h1>
            <span className={`badge ${approved ? "bg-brand-500 text-white" : "bg-amber-500 text-white"}`}>{agent.status} · {agent.commission_pct}% commission</span>
          </div>
        </div>
      </div>

      <div className="container-x space-y-8 py-8">
        {!approved && (
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your agency account is <b>{agent.status}</b>. Net rates and quote creation unlock once our team approves it (usually within one business day).
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Quotes", value: String(stats.quotes) },
            { label: "Bookings", value: String(stats.bookings) },
            { label: "Booking value", value: displayMoney(stats.value, currency) },
            { label: "Commission earned", value: displayMoney(stats.commission, currency) },
          ].map((s) => (
            <div key={s.label} className="card p-5">
              <div className="text-xs uppercase tracking-wide text-gray-500">{s.label}</div>
              <div className="mt-1 text-2xl font-bold text-brand-700">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <QuoteBuilder tours={tours.map((t) => ({ id: t.id, title: t.title, base_price: t.base_price, agent_price: t.agent_price, sale_price: t.sale_price, agent_discount_pct: t.agent_discount_pct }))} />

          <div className="space-y-8">
            {/* NET RATE CATALOG */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-medium">Net-rate catalog</h2>
                <span className="text-xs text-gray-500">{approved ? "Net rates visible" : "Net rates locked until approved"}</span>
              </div>
              <div className="mt-4 space-y-2">
                {tours.slice(0, 12).map((t) => {
                  const retail = t.sale_price ?? t.base_price;
                  // Explicit net price > supplier's discount % > no discount (retail).
                  const net =
                    t.agent_price ??
                    (t.agent_discount_pct != null && t.agent_discount_pct > 0
                      ? Math.round(retail * (1 - t.agent_discount_pct / 100) * 100) / 100
                      : retail);
                  return (
                    <div key={t.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <Link href={`/tours/${t.slug}`} className="font-semibold hover:text-brand-600">{t.title}</Link>
                        <div className="text-xs text-gray-400">{t.duration_text} · ★ {t.rating.toFixed(1)}</div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-400 line-through">{displayMoney(retail, currency)}</span>
                        <span className="font-bold text-brand-700">{approved ? displayMoney(net, currency) : "—"}</span>
                        <Link href={`/book/${t.slug}`} className="btn-primary btn-sm">Book</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* QUOTES */}
            <section>
              <h2 className="font-display text-xl font-medium">My quotes</h2>
              {quotes.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No quotes yet — build one on the left.</p>
              ) : (
                <div className="card mt-3 overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Tour</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Pax</th><th className="px-4 py-3">Net total</th><th className="px-4 py-3">Status</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quotes.map((q) => (
                        <tr key={q.id}>
                          <td className="px-4 py-3 font-mono text-xs">{q.reference}</td>
                          <td className="px-4 py-3 font-medium">{q.tour_title}</td>
                          <td className="px-4 py-3">{fmtDate(q.travel_date)}</td>
                          <td className="px-4 py-3">{q.pax}</td>
                          <td className="px-4 py-3 font-semibold">{displayMoney(q.net_total, currency)}</td>
                          <td className="px-4 py-3">
                            <form action={setQuoteStatusFormAction} className="flex items-center gap-2">
                              <input type="hidden" name="quoteId" value={q.id} />
                              <select name="status" defaultValue={q.status} className="input w-32 py-1 text-xs">
                                {["DRAFT", "SENT", "NEGOTIATING", "ACCEPTED", "LOST"].map((s) => <option key={s}>{s}</option>)}
                              </select>
                              <button type="submit" className="text-xs font-semibold text-brand-600 hover:underline">Set</button>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* BOOKINGS */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-medium">My bookings</h2>
                <a href="/api/bookings?format=csv" className="btn-outline btn-sm">⬇ Export CSV</a>
              </div>
              {bookings.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">No bookings yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {bookings.map((b) => (
                    <div key={b.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                      <div>
                        <div className="font-mono text-xs text-gray-400">{b.booking_number}</div>
                        <div className="font-semibold">{b.tour_title}</div>
                        <div className="text-sm text-gray-500">{fmtDate(b.travel_date)} · {b.pax} pax</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-brand-700">{displayMoney(b.total_price, currency)}</div>
                        <span className={`badge ${b.booking_status === "CONFIRMED" ? "bg-brand-100 text-brand-700" : b.booking_status === "CANCELLED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>
                          {b.booking_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
