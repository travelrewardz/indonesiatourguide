import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { displayMoney } from "@/lib/currency";
import { getDisplayCurrency } from "@/lib/prefs";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-brand-100 text-brand-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
};

export default async function AccountHome() {
  const user = (await getSessionUser())!;
  const currency = await getDisplayCurrency();
  const bookings = all<Booking & { tour_title: string; tour_slug: string }>(
    `SELECT b.*, t.title AS tour_title, t.slug AS tour_slug FROM bookings b JOIN tours t ON t.id = b.tour_id
     WHERE b.customer_id = ? ORDER BY b.travel_date DESC LIMIT 5`, user.id,
  );
  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE customer_id = ?", user.id)?.c ?? 0,
    upcoming: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE customer_id = ? AND travel_date >= ? AND booking_status IN ('PENDING','CONFIRMED')", user.id, today)?.c ?? 0,
    completed: get<{ c: number }>("SELECT COUNT(*) AS c FROM bookings WHERE customer_id = ? AND booking_status = 'COMPLETED'", user.id)?.c ?? 0,
    spent: get<{ s: number | null }>("SELECT SUM(total_price) AS s FROM bookings WHERE customer_id = ? AND payment_status = 'PAID'", user.id)?.s ?? 0,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      {[
        { label: "Total bookings", value: String(stats.total) },
        { label: "Upcoming trips", value: String(stats.upcoming) },
        { label: "Completed", value: String(stats.completed) },
        { label: "Total spent", value: displayMoney(stats.spent, currency) },
      ].map((s) => (
        <div key={s.label} className="card p-5">
          <div className="text-xs uppercase tracking-wide text-gray-500">{s.label}</div>
          <div className="mt-1 text-2xl font-bold text-brand-700">{s.value}</div>
        </div>
      ))}

      <div className="lg:col-span-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-medium">Recent bookings</h2>
          <Link href="/account/bookings" className="text-sm font-semibold text-brand-600 hover:underline">View all →</Link>
        </div>

        {bookings.length === 0 ? (
          <div className="card mt-4 p-10 text-center">
            <div className="text-4xl">🎒</div>
            <h3 className="mt-3 text-lg font-bold">No bookings yet</h3>
            <p className="mt-1 text-sm text-gray-600">Your confirmed trips and vouchers will appear here.</p>
            <Link href="/tours" className="btn-primary mt-5">Explore tours</Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {bookings.map((b) => (
              <Link key={b.id} href={`/account/bookings/${b.booking_number}`}
                className="card flex flex-wrap items-center justify-between gap-4 p-5 hover:shadow-md">
                <div>
                  <div className="font-mono text-xs text-gray-400">{b.booking_number}</div>
                  <div className="font-semibold">{b.tour_title}</div>
                  <div className="text-sm text-gray-500">{fmtDate(b.travel_date)} · {b.pax} travellers</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-brand-700">{displayMoney(b.total_price, currency)}</div>
                    <div className="text-xs text-gray-400">{b.payment_status}</div>
                  </div>
                  <span className={`badge ${STATUS_STYLE[b.booking_status] ?? "bg-gray-100 text-gray-600"}`}>{b.booking_status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
