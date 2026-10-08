import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { all, get } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function SupplierHome() {
  const user = (await getSessionUser())!;
  const supplier = get<{ id: string; company_name: string; commission_pct: number }>(
    "SELECT id, company_name, commission_pct FROM suppliers WHERE user_id = ?", user.id,
  );
  if (!supplier) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-lg font-bold">No supplier profile linked</h2>
        <p className="mt-2 text-sm text-gray-600">Contact support to link your account to an operator profile.</p>
      </div>
    );
  }

  const stats = {
    tours: get<{ c: number }>("SELECT COUNT(*) AS c FROM tours WHERE supplier_id = ?", supplier.id)?.c ?? 0,
    published: get<{ c: number }>("SELECT COUNT(*) AS c FROM tours WHERE supplier_id = ? AND status = 'PUBLISHED'", supplier.id)?.c ?? 0,
    pending: get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM bookings b JOIN tours t ON t.id = b.tour_id WHERE t.supplier_id = ? AND b.confirmation_status = 'UNCONFIRMED' AND b.booking_status = 'PENDING'",
      supplier.id,
    )?.c ?? 0,
    upcoming: get<{ c: number }>(
      "SELECT COUNT(*) AS c FROM bookings b JOIN tours t ON t.id = b.tour_id WHERE t.supplier_id = ? AND b.travel_date >= ? AND b.booking_status IN ('PENDING','CONFIRMED')",
      supplier.id, new Date().toISOString().slice(0, 10),
    )?.c ?? 0,
    earnings: get<{ s: number | null }>(
      "SELECT SUM(b.supplier_amount) AS s FROM bookings b JOIN tours t ON t.id = b.tour_id WHERE t.supplier_id = ? AND b.payment_status = 'PAID' AND b.booking_status != 'CANCELLED'",
      supplier.id,
    )?.s ?? 0,
  };

  const recent = all<{ booking_number: string; title: string; travel_date: string; pax: number; total_price: number; booking_status: string; confirmation_status: string; customer_name: string }>(
    `SELECT b.booking_number, t.title, b.travel_date, b.pax, b.total_price, b.booking_status, b.confirmation_status, b.customer_name
     FROM bookings b JOIN tours t ON t.id = b.tour_id
     WHERE t.supplier_id = ? ORDER BY b.created_at DESC LIMIT 6`, supplier.id,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "My tours", value: `${stats.published}/${stats.tours}`, href: "/supplier/tours" },
          { label: "Awaiting confirmation", value: String(stats.pending), href: "/supplier/bookings" },
          { label: "Upcoming departures", value: String(stats.upcoming), href: "/supplier/bookings" },
          { label: "Earnings (paid)", value: `$${Math.round(stats.earnings).toLocaleString()}` },
          { label: "Commission", value: `${supplier.commission_pct}%` },
        ].map((s) => (
          <Link key={s.label} href={s.href ?? "#"} className="card p-5 transition-shadow hover:shadow-md">
            <div className="text-xs uppercase tracking-wide text-gray-500">{s.label}</div>
            <div className="mt-1 text-2xl font-bold text-brand-700">{s.value}</div>
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium">Recent bookings</h2>
        <Link href="/supplier/bookings" className="text-sm font-semibold text-brand-600 hover:underline">All bookings →</Link>
      </div>

      {recent.length === 0 ? (
        <div className="card p-10 text-center text-sm text-gray-600">
          No bookings yet. <Link href="/supplier/tours" className="font-semibold text-brand-600 hover:underline">Publish your tours</Link> to start receiving them.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Booking</th><th className="px-4 py-3">Tour</th><th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th><th className="px-4 py-3">Pax</th><th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map((b) => (
                <tr key={b.booking_number}>
                  <td className="px-4 py-3 font-mono text-xs">{b.booking_number}</td>
                  <td className="px-4 py-3 font-medium">{b.title}</td>
                  <td className="px-4 py-3">{b.customer_name}</td>
                  <td className="px-4 py-3">{fmtDate(b.travel_date)}</td>
                  <td className="px-4 py-3">{b.pax}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${b.confirmation_status === "CONFIRMED" ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-800"}`}>
                      {b.confirmation_status === "CONFIRMED" ? "Confirmed" : "Needs action"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
